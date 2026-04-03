/**
 * POST /api/outputs — save a generated output to the database.
 *
 * Used by the generate panel when auto_save is false.
 * Accepts the same payload shape returned by the generate routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  let body: {
    output_type: string;
    audience_id: string;
    title: string;
    content: Record<string, unknown>;
    rya_score: number | null;
    rya_rationale: string | null;
    channel: string | null;
    genre_signals_used: Record<string, unknown>[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', detail: 'Request body must be valid JSON' },
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
  } = body;

  if (!output_type || !audience_id || !title || !content || !genre_signals_used) {
    return NextResponse.json(
      { error: 'missing_field', detail: 'Required fields: output_type, audience_id, title, content, genre_signals_used' },
      { status: 400 }
    );
  }

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
