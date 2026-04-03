/**
 * DELETE /api/outputs/[id] — delete a saved output.
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'missing_field', detail: 'id is required' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from('saved_outputs')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: 'db_error', detail: 'Failed to delete output' },
      { status: 500 }
    );
  }

  return NextResponse.json({ deleted: true }, { status: 200 });
}
