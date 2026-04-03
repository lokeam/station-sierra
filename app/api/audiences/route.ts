import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, filter_definition, respondent_ids } = body;

  if (!name || !filter_definition || !respondent_ids) {
    return NextResponse.json(
      { error: 'Missing required fields: name, filter_definition, respondent_ids' },
      { status: 400 },
    );
  }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
