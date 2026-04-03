/**
 * POST /api/generate/concept — campaign concept generation route.
 *
 * Orchestrates the generate → evaluate → refine loop (max 3 attempts).
 * Computes genre signals from Supabase, sanitizes the brief (`lib/sanitize.ts`),
 * calls gpt-4o-mini via `generateObject()` (`lib/schemas.ts`), runs evals
 * (`lib/evals.ts`), and on failure constructs a targeted refinement prompt
 * (`lib/prompts.ts`). Every attempt is traced in Phoenix.
 *
 * Request:  `{ audience_id: string, brand_name?: string, brief?: string }`
 * Response: 200 saved output | 404 audience not found | 422 evals exhausted | 500 db error
 *
 * CSRF: This route is not vulnerable to classic CSRF attacks. Next.js App Router
 * API routes require an explicit `Content-Type: application/json` header for JSON
 * parsing. Browsers will not send JSON payloads cross-origin without a CORS
 * preflight, and no permissive CORS policy is configured. This makes form-based
 * and image-tag CSRF vectors ineffective against these endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { SpanStatusCode } from '@opentelemetry/api';
import { conceptSchema } from '@/lib/schemas';
import { runEvals, evalGroundedness } from '@/lib/evals';
import {
  SYSTEM_PROMPT,
  formatGenreSignals,
  conceptGenerationPrompt,
  getRefinementPrompt,
} from '@/lib/prompts';
import { sanitizeBrief } from '@/lib/sanitize';
import { getGenreSignals } from '@/lib/genre-signals';
import { createServiceClient } from '@/lib/supabase';
import { tracer } from '@/lib/telemetry';
import type {
  CampaignConcept,
  GenreSignal,
  InterestRow,
  GenreInfo,
} from '@/lib/types';

const MAX_ATTEMPTS = 3;

export async function POST(req: NextRequest) {
  let body: { audience_id?: string; brand_name?: string; brief?: string; auto_save?: boolean };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', detail: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  const { audience_id, brand_name, brief, auto_save = true } = body;

  if (!audience_id) {
    return NextResponse.json(
      { error: 'missing_field', detail: 'audience_id is required' },
      { status: 400 }
    );
  }

  return tracer.startActiveSpan('generate.concept', async (span) => {
    try {
      span.setAttribute('audience.id', audience_id);
      span.setAttribute('output.type', 'campaign_concept');
      span.setAttribute('llm.model', 'gpt-4o-mini');

      const supabase = createServiceClient();

      // Fetch audience
      const { data: audience, error: audienceError } = await supabase
        .from('audiences')
        .select('*')
        .eq('id', audience_id)
        .single();

      if (audienceError || !audience) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Audience not found' });
        span.end();
        return NextResponse.json(
          { error: 'not_found', detail: 'Audience not found' },
          { status: 404 }
        );
      }

      span.setAttribute('audience.name', audience.name);
      span.setAttribute('audience.respondent_count', audience.respondent_ids.length);

      const respondentIds: number[] = audience.respondent_ids;

      // Fetch all interests and genres for signal computation
      const [interestsRes, genresRes] = await Promise.all([
        supabase.from('respondent_genre_interest').select('*'),
        supabase.from('genres').select('*'),
      ]);

      if (interestsRes.error || genresRes.error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Failed to fetch genre data' });
        span.end();
        return NextResponse.json(
          { error: 'db_error', detail: 'Failed to fetch genre data' },
          { status: 500 }
        );
      }

      const allInterests: InterestRow[] = interestsRes.data;
      const genres: GenreInfo[] = genresRes.data;

      // Compute genre signals for this audience
      const genreSignals: GenreSignal[] = getGenreSignals(
        respondentIds,
        allInterests,
        genres
      );

      const genreSignalsText = formatGenreSignals(genreSignals);

      // Sanitize brief (attempt 1 only)
      const briefResult = brief ? sanitizeBrief(brief) : null;
      const safeBrief = briefResult?.sanitized ?? '';
      const brandText = brand_name ?? '';

      span.setAttribute('security.brief_sanitized', briefResult?.wasSanitized ?? false);
      span.setAttribute('security.patterns_matched', briefResult?.matched ?? 0);

      let lastOutput: Record<string, unknown> | null = null;
      let lastFailedEval: string | null = null;
      let lastFailDetail = '';
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;
      let totalLatencyMs = 0;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        // Build prompt
        let userPrompt: string;

        if (attempt === 1) {
          userPrompt = conceptGenerationPrompt(
            genreSignalsText,
            brandText,
            safeBrief
          );
        } else {
          userPrompt = getRefinementPrompt(
            lastFailedEval!,
            lastFailDetail,
            JSON.stringify(lastOutput, null, 2),
            genreSignalsText
          );
        }

        // Call LLM
        const callStart = Date.now();
        const { object, usage } = await generateObject({
          model: openai('gpt-4o-mini'),
          schema: conceptSchema,
          system: SYSTEM_PROMPT,
          prompt: userPrompt,
        });
        const callLatencyMs = Date.now() - callStart;

        totalPromptTokens += usage.inputTokens ?? 0;
        totalCompletionTokens += usage.outputTokens ?? 0;
        totalLatencyMs += callLatencyMs;

        // Run evals
        const evalResult = runEvals(
          object as unknown as CampaignConcept,
          'campaign_concept',
          genreSignals
        );

        if (evalResult.pass) {
          // Get cited genres for span attribute
          const groundResult = evalGroundedness(
            object as unknown as CampaignConcept,
            genreSignals
          );

          span.setAttribute('llm.attempts', attempt);
          span.setAttribute('llm.total_prompt_tokens', totalPromptTokens);
          span.setAttribute('llm.total_completion_tokens', totalCompletionTokens);
          span.setAttribute('llm.total_latency_ms', totalLatencyMs);
          span.setAttribute('eval.final_pass', true);
          span.setAttribute('eval.failure_eval', '');
          span.setAttribute('eval.failure_detail', '');
          span.setAttribute('eval.attempts_before_pass', attempt);
          span.setAttribute('output.rya_score', object.rya_score);
          span.setAttribute('output.genres_cited', (groundResult.cited ?? []).join(', '));

          // Build output payload
          const outputPayload = {
            output_type: 'campaign_concept' as const,
            audience_id,
            title: object.title,
            content: object,
            rya_score: object.rya_score,
            rya_rationale: object.rya_rationale,
            channel: object.channel,
            genre_signals_used: object.genre_signals_used,
          };

          if (!auto_save) {
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
            return NextResponse.json(outputPayload, { status: 200 });
          }

          // Save to saved_outputs
          const { data: saved, error: saveError } = await supabase
            .from('saved_outputs')
            .insert(outputPayload)
            .select()
            .single();

          if (saveError) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: 'Failed to save output' });
            span.end();
            return NextResponse.json(
              { error: 'db_error', detail: 'Failed to save output' },
              { status: 500 }
            );
          }

          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
          return NextResponse.json(saved, { status: 200 });
        }

        // Eval failed — record for refinement
        lastOutput = object as unknown as Record<string, unknown>;
        lastFailedEval = evalResult.failedEval;
        lastFailDetail = evalResult.detail;
      }

      // All attempts exhausted
      span.setAttribute('llm.attempts', MAX_ATTEMPTS);
      span.setAttribute('llm.total_prompt_tokens', totalPromptTokens);
      span.setAttribute('llm.total_completion_tokens', totalCompletionTokens);
      span.setAttribute('llm.total_latency_ms', totalLatencyMs);
      span.setAttribute('eval.final_pass', false);
      span.setAttribute('eval.failure_eval', lastFailedEval ?? '');
      span.setAttribute('eval.failure_detail', lastFailDetail);
      span.setAttribute('eval.attempts_before_pass', MAX_ATTEMPTS);
      span.setAttribute('output.rya_score', 0);
      span.setAttribute('output.genres_cited', '');

      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: `eval failed after ${MAX_ATTEMPTS} attempts: ${lastFailDetail}`,
      });
      span.end();

      return NextResponse.json(
        {
          error: 'eval_failed',
          detail: `Generation failed after ${MAX_ATTEMPTS} attempts. Last failure: ${lastFailDetail}`,
          last_failed_eval: lastFailedEval,
        },
        { status: 422 }
      );
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      span.end();
      throw err;
    }
  });
}
