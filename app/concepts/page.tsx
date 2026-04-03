import { createServiceClient } from '@/lib/supabase';
import { getGenreSignals } from '@/lib/genre-signals';
import { ConceptsList } from '../components/concepts-list';
import type { InterestRow, GenreInfo } from '@/lib/types';

interface ConceptsPageProps {
  searchParams: Promise<{ audience?: string; type?: string }>;
}

export default async function ConceptsPage({ searchParams }: ConceptsPageProps) {
  const params = await searchParams;
  const supabase = createServiceClient();

  const [
    { data: savedOutputs },
    { data: audiences },
    { data: genres },
    { data: interests },
  ] = await Promise.all([
    supabase
      .from('saved_outputs')
      .select('id, output_type, audience_id, title, content, rya_score, channel, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('audiences')
      .select('id, name, respondent_ids')
      .order('name'),
    supabase
      .from('genres')
      .select('genre_slug, genre_name, genre_categories'),
    supabase
      .from('respondent_genre_interest')
      .select('respondent_id, genre_slug, interest_level'),
  ]);

  // Build audience lookup for names + top signals
  const audienceOptions = (audiences ?? []).map((a) => {
    const signals = getGenreSignals(
      a.respondent_ids as number[],
      (interests ?? []) as InterestRow[],
      (genres ?? []) as GenreInfo[]
    );
    return {
      id: a.id as string,
      name: a.name as string,
      respondent_count: (a.respondent_ids as number[]).length,
      top_signals: signals.slice(0, 3),
    };
  });

  const audienceNameMap = new Map(
    (audiences ?? []).map((a) => [a.id, a.name as string])
  );

  const outputsWithAudience = (savedOutputs ?? []).map((o) => ({
    ...o,
    audience_name: audienceNameMap.get(o.audience_id) ?? 'Unknown',
  }));

  return (
    <ConceptsList
      savedOutputs={outputsWithAudience}
      audiences={audienceOptions}
      initialAudienceId={params.audience}
      initialType={params.type === 'persona' ? 'persona' : params.type === 'concept' ? 'concept' : undefined}
    />
  );
}
