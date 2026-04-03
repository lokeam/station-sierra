/**
 * Zod schemas for LLM-generated outputs (concept and persona).
 *
 * Passed to Vercel AI SDK `generateObject()` to enforce structured output.
 * Must stay in sync with prompt templates in `lib/prompts.ts` — schema drift
 * between these two files is the most common source of eval failures.
 */

import { z } from 'zod';

const genreSignalSchema = z.object({
  genre_name: z.string(),
  avg_score: z.number(),
});

/** Campaign concept output — title, narrative, channel, RYA score, and cited genre signals. */
export const conceptSchema = z.object({
  title: z.string().describe('short evocative campaign name'),
  concept: z
    .string()
    .describe(
      '2-4 sentence description. Must cite at least 2 specific genres by name and score.'
    ),
  channel: z.string().describe('primary recommended channel or format'),
  rya_score: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe('integer 1-10, no float, no string'),
  rya_rationale: z
    .string()
    .describe(
      'one sentence citing specific genre signals that justify the creative risk score'
    ),
  genre_signals_used: z
    .array(genreSignalSchema)
    .min(2)
    .max(5)
    .describe(
      'only genres that directly informed the concept. genre_name must exactly match input.'
    ),
});

/** Audience persona output — who they are, what resonates/doesn't, creative direction. No RYA score. */
export const personaSchema = z.object({
  persona_name: z
    .string()
    .describe('descriptive name for this audience type'),
  who_they_are: z
    .string()
    .describe(
      '2-3 sentences. Must cite at least 2 genres by name and score.'
    ),
  what_they_care_about: z
    .array(z.string())
    .min(2)
    .describe('claims citing a specific genre name and score'),
  what_does_not_resonate: z
    .array(z.string())
    .min(1)
    .describe('claims citing a specific low-interest genre and score'),
  creative_direction: z
    .string()
    .describe('2-3 sentences. Must cite genres.'),
  genre_signals_used: z
    .array(genreSignalSchema)
    .describe(
      'every genre cited anywhere in the output. genre_name must exactly match input names.'
    ),
});

export type ConceptOutput = z.infer<typeof conceptSchema>;
export type PersonaOutput = z.infer<typeof personaSchema>;
