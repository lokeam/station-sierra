/**
 * POST /api/generate/card-image — card image generation route.
 *
 * Reads a saved output from `saved_outputs`, uses gpt-4o-mini to write a
 * DALL-E 3 prompt grounded in the output's content and genre signals,
 * generates a 1024×1024 image, uploads to Supabase Storage `card-images`
 * bucket, and updates the saved output with `card_image_url` and
 * `card_image_prompt`. Single Phoenix span per generation.
 *
 * Request:  `{ output_id: string }`
 * Response: 200 updated saved_output | 400 missing field | 404 not found | 500 error
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject, generateImage } from 'ai';
import { SpanStatusCode } from '@opentelemetry/api';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase';
import { tracer } from '@/lib/telemetry';
import { cardImageSystemPrompt, cardImageUserPrompt } from '@/lib/prompts';

const dallePromptSchema = z.object({
  prompt: z.string().max(1000),
});

export async function POST(req: NextRequest) {
  let body: { output_id?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', detail: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  const { output_id } = body;

  if (!output_id) {
    return NextResponse.json(
      { error: 'missing_field', detail: 'output_id is required' },
      { status: 400 }
    );
  }

  return tracer.startActiveSpan('generate.card-image', async (span) => {
    try {
      span.setAttribute('output.id', output_id);

      const supabase = createServiceClient();

      // Fetch the saved output
      const { data: savedOutput, error: fetchError } = await supabase
        .from('saved_outputs')
        .select('*')
        .eq('id', output_id)
        .single();

      if (fetchError || !savedOutput) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Output not found' });
        span.end();
        return NextResponse.json(
          { error: 'not_found', detail: 'Saved output not found' },
          { status: 404 }
        );
      }

      span.setAttribute('output.type', savedOutput.output_type);

      // Build the user prompt for gpt-4o-mini to write a DALL-E prompt
      const content = savedOutput.content as Record<string, unknown>;
      const genreSignals = savedOutput.genre_signals_used as Array<{
        genre_name: string;
        avg_score: number;
      }>;
      const userPrompt = cardImageUserPrompt(
        savedOutput.output_type,
        content,
        genreSignals
      );

      // Step 1: gpt-4o-mini writes the DALL-E 3 prompt
      const { object: promptResult } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: dallePromptSchema,
        system: cardImageSystemPrompt(),
        prompt: userPrompt,
      });

      const dallePrompt = promptResult.prompt;
      span.setAttribute('card_image.prompt_length', dallePrompt.length);

      // Step 2: Generate image with DALL-E 3
      const { image } = await generateImage({
        model: openai.image('dall-e-3'),
        prompt: dallePrompt,
        size: '1024x1024',
        n: 1,
      });

      const imageData = image.uint8Array;
      span.setAttribute('card_image.image_size', '1024x1024');

      // Step 3: Upload to Supabase Storage
      const storagePath = `${output_id}.png`;

      const { error: uploadError } = await supabase.storage
        .from('card-images')
        .upload(storagePath, imageData, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Storage upload failed: ${uploadError.message}`,
        });
        span.end();
        return NextResponse.json(
          { error: 'storage_error', detail: 'Failed to upload image' },
          { status: 500 }
        );
      }

      // Build public URL
      const { data: publicUrlData } = supabase.storage
        .from('card-images')
        .getPublicUrl(storagePath);

      const cardImageUrl = publicUrlData.publicUrl;

      // Step 4: Update saved_outputs with image URL and prompt
      const { data: updated, error: updateError } = await supabase
        .from('saved_outputs')
        .update({
          card_image_url: cardImageUrl,
          card_image_prompt: dallePrompt,
        })
        .eq('id', output_id)
        .select()
        .single();

      if (updateError) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `DB update failed: ${updateError.message}`,
        });
        span.end();
        return NextResponse.json(
          { error: 'db_error', detail: 'Failed to update saved output' },
          { status: 500 }
        );
      }

      span.setAttribute('card_image.url_saved', true);
      span.setAttribute('card_image.model', 'dall-e-3');
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return NextResponse.json(updated, { status: 200 });
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'An unexpected error occurred',
      });
      span.end();
      return NextResponse.json(
        { error: 'internal_error', detail: 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  });
}
