import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { OutputDetail } from '../../../components/output-detail';

interface ConceptDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConceptDetailPage({ params }: ConceptDetailPageProps) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: output, error } = await supabase
    .from('saved_outputs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !output) {
    notFound();
  }

  // Fetch audience info
  let audience = null;
  if (output.audience_id) {
    const { data: audienceData, error: audienceError } = await supabase
      .from('audiences')
      .select('id, name, respondent_ids, filter_definition')
      .eq('id', output.audience_id)
      .single();
    if (!audienceError) {
      audience = audienceData;
    }
  }

  return (
    <OutputDetail
      output={output}
      audience={audience}
    />
  );
}
