export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase';

const audienceBodySchema = z.object({
  name: z.string().min(1).max(200),
  filter_definition: z.object({
    filters: z.array(
      z.object({
        genre_slug: z.string(),
        max_level: z.number().int().min(1).max(5),
      })
    ),
  }),
  respondent_ids: z.array(z.number().int().positive()),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', detail: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const parsed = audienceBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', detail: 'Invalid request format' },
      { status: 400 },
    );
  }

  const { name, filter_definition, respondent_ids } = parsed.data;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('audiences')
    .insert({
      name,
      filter_definition,
      respondent_ids,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'db_error', detail: 'Failed to create audience' },
      { status: 500 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}
