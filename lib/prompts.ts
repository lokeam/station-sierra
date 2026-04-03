/**
 * LLM prompt templates for concept and persona generation.
 *
 * Each generation prompt tells chosen LLM model what to produce on attempt 1.
 * Each refinement prompt targets a specific eval failure on attempt 2+.
 * The JSON schemas described in these templates must match the Zod schemas
 * in `lib/schemas.ts` exactly.
 */

import type { GenreSignal } from './types';

/**
 * Shared system prompt injected into every generateObject() call.
 * Sets the LLM's role (marketing strategist), explains the inverted
 * interest scale (1 = highest), and enforces the grounding rule:
 * every claim must cite a genre name and score.
 */
export const SYSTEM_PROMPT = `You are a senior marketing strategist at a creative agency.
You specialize in translating quantitative audience data into
defensible creative direction.

You will be given genre interest data for a specific audience
segment. Interest levels use an inverted scale: 1 = highest
interest, 5 = no meaningful interest.

REQUIREMENT: Every claim you make must cite at least one specific
genre by name and its interest score. Do not generate generic
marketing copy. If a claim cannot be grounded in the provided
genre data, do not include it.

Respond only with valid JSON matching the schema provided.
Do not include markdown, code fences, or explanatory text.`;

/** Formats genre signals as a sorted bullet list for prompt interpolation. */
export function formatGenreSignals(signals: GenreSignal[]): string {
  return [...signals]
    .sort((a, b) => a.avg_score - b.avg_score)
    .map((g) => `- ${g.genre_name}: ${g.avg_score.toFixed(2)}`)
    .join('\n');
}

/** Asks the LLM to produce a campaign concept grounded in genre signals, with RYA score. */
export function conceptGenerationPrompt(
  genreSignalsText: string,
  brand: string,
  brief: string
): string {
  return `Generate a campaign concept for the following audience and brand.

AUDIENCE GENRE INTERESTS (1=highest, 5=none):
${genreSignalsText}

BRAND / PRODUCT:
${brand}

BRIEF (optional context):
${brief}

Respond with this exact JSON schema:
{
  "title": "short evocative campaign name",
  "concept": "2-4 sentence description. Must cite at least 2
              specific genres by name and score.",
  "channel": "primary recommended channel or format",
  "rya_score": <integer 1-10, no float, no string>,
  "rya_rationale": "one sentence citing specific genre signals
                    that justify the creative risk score",
  "genre_signals_used": [
    {"genre_name": "<exact genre name from input>", "avg_score": <float>}
  ]
}

RYA SCORE GUIDE:
1-3: Safe. Concept aligns with the audience's strongest interests.
4-6: Moderate. Unconventional but supported by secondary signals.
7-10: Radical. Significantly unexpected. Cite the specific signals
      that support the creative bet.

genre_signals_used: only genres that directly informed the concept.
Minimum 2, maximum 5. genre_name must exactly match input.
rya_score must be an integer. Not a float. Not a string.`;
}

/** Asks the LLM to produce an audience persona snapshot citing genre names and scores. */
export function personaGenerationPrompt(
  genreSignalsText: string
): string {
  return `Generate an audience persona snapshot for the following audience segment.

AUDIENCE GENRE INTERESTS (1=highest, 5=none):
${genreSignalsText}

Respond with this exact JSON schema:
{
  "persona_name": "descriptive name for this audience type",
  "who_they_are": "2-3 sentences describing who these people are.
                   Must cite at least 2 genres by exact name and score.",
  "what_they_care_about": [
    "claim citing a specific genre name and its score",
    "claim citing a specific genre name and its score"
  ],
  "what_does_not_resonate": [
    "claim citing a specific low-interest genre and its score"
  ],
  "creative_direction": "2-3 sentences on how to reach this audience.
                         Must cite genres.",
  "genre_signals_used": [
    {"genre_name": "<exact genre name from input>", "avg_score": <float>}
  ]
}

RULES:
- who_they_are must cite at least 2 genres by exact name and score
- what_they_care_about: each item must cite a specific genre and score
- what_does_not_resonate: cite genres with scores >= 4 (low interest)
- creative_direction must reference genres to ground the recommendation
- genre_signals_used: every genre cited anywhere in the output.
  genre_name must exactly match the input names. Minimum 2.
- Do NOT include rya_score, channel, or any campaign-specific fields`;
}

/** Asks the LLM to fix a schema violation while preserving valid creative content. */
export function schemaRefinementPrompt(
  failureDetail: string,
  previousOutput: string,
  genreSignalsText: string
): string {
  return `Your previous output failed a schema validation check.

FAILURE REASON:
${failureDetail}

PREVIOUS OUTPUT (invalid):
${previousOutput}

AUDIENCE GENRE INTERESTS (1=highest, 5=none):
${genreSignalsText}

Rewrite the output fixing only the schema violation described above.
Maintain all creative content that was valid.
Return the same JSON schema as before with the violation corrected.`;
}

/** Asks the LLM to rewrite output so every claim cites a genre by exact name and score. */
export function groundednessRefinementPrompt(
  failureDetail: string,
  previousOutput: string,
  genreSignalsText: string
): string {
  return `Your previous output failed a groundedness check.
It did not cite enough genres from the audience data by name.

FAILURE REASON:
${failureDetail}

GENRES THAT MUST BE CITED BY EXACT NAME:
${genreSignalsText}

PREVIOUS OUTPUT (insufficiently grounded):
${previousOutput}

Rewrite the output so that every claim cites at least one specific
genre by its exact name and score from the list above.
Do not invent genre names. Do not paraphrase genre names.
Use the exact strings provided.
Maintain the same JSON schema. Maintain the same creative direction
unless it cannot be grounded in the data.`;
}

/** Asks the LLM to correct an out-of-range RYA score to a valid 1–10 integer. */
export function ryaRefinementPrompt(
  failureDetail: string,
  previousOutput: string
): string {
  return `Your previous output contained an invalid RYA score.

FAILURE REASON:
${failureDetail}

PREVIOUS OUTPUT:
${previousOutput}

The rya_score field must be a whole integer between 1 and 10.
No decimals. No strings. No values outside 1-10.

Rewrite only the rya_score field to be a valid integer.
Do not change any other field.
Return the complete JSON output with the corrected rya_score.`;
}

/** System prompt for gpt-4o-mini when writing DALL-E 3 prompts. */
export function cardImageSystemPrompt(): string {
  return `You write concise DALL-E 3 prompts for marketing card images. Output only the prompt, no explanation. Keep it under 200 words. Avoid text/words in the image.`;
}

/** Builds the user prompt for gpt-4o-mini to write a DALL-E 3 image prompt. */
export function cardImageUserPrompt(
  outputType: string,
  content: Record<string, unknown>,
  genreSignals: Array<{ genre_name: string; avg_score: number }>
): string {
  const signalsText = genreSignals
    .map((g) => `${g.genre_name} (${g.avg_score.toFixed(1)})`)
    .join(', ');

  if (outputType === 'persona') {
    return `Write a DALL-E 3 prompt for a marketing card image representing this audience persona.

PERSONA NAME: ${content.persona_name}
WHO THEY ARE: ${content.who_they_are}
WHAT THEY CARE ABOUT: ${(content.what_they_care_about as string[]).join('; ')}
CREATIVE DIRECTION: ${content.creative_direction}
GENRE SIGNALS: ${signalsText}`;
  }

  return `Write a DALL-E 3 prompt for a marketing card image representing this campaign concept.

TITLE: ${content.title}
CONCEPT: ${content.concept}
CHANNEL: ${content.channel}
GENRE SIGNALS: ${signalsText}`;
}

/** Dispatches to the appropriate refinement prompt based on which eval failed. */
export function getRefinementPrompt(
  failedEval: string,
  failureDetail: string,
  previousOutput: string,
  genreSignalsText: string
): string {
  switch (failedEval) {
    case 'schema':
      return schemaRefinementPrompt(
        failureDetail,
        previousOutput,
        genreSignalsText
      );
    case 'groundedness':
      return groundednessRefinementPrompt(
        failureDetail,
        previousOutput,
        genreSignalsText
      );
    case 'rya_range':
      return ryaRefinementPrompt(failureDetail, previousOutput);
    default:
      return schemaRefinementPrompt(
        failureDetail,
        previousOutput,
        genreSignalsText
      );
  }
}
