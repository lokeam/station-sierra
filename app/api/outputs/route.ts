/**
 * POST /api/outputs — save a generated output to the database.
 *
 * Used by the generate panel when auto_save is false.
 * Accepts the same payload shape returned by the generate routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase';

const outputBodySchema = z.object({
  output_type: z.enum(['campaign_concept', 'persona']),
  audience_id: z.string().uuid(),
  title: z.string().min(1),
  content: z.record(z.string(), z.unknown()),
  rya_score: z.number().int().min(1).max(10).nullable(),
  rya_rationale: z.string().nullable(),
  channel: z.string().nullable(),
  genre_signals_used: z.array(
    z.object({
      genre_name: z.string(),
      avg_score: z.number(),
    })
  ),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', detail: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  const parsed = outputBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', detail: 'Invalid request format' },
      { status: 400 }
    );
  }

  const {
    output_type,
    audience_id,
    title,
    content,
    rya_score,
    rya_rationale,
    channel,
    genre_signals_used,
  } = parsed.data;

  const supabase = createServiceClient();

  const { data: saved, error } = await supabase
    .from('saved_outputs')
    .insert({
      output_type,
      audience_id,
      title,
      content,
      rya_score,
      rya_rationale,
      channel,
      genre_signals_used,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'db_error', detail: 'Failed to save output' },
      { status: 500 }
    );
  }

  return NextResponse.json(saved, { status: 201 });
}
