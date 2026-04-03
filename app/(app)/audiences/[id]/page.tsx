import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { getGenreSignals, getPopulationAverages, computeDeltas } from '@/lib/genre-signals';
import { AudienceDetail } from '../../../components/audience-detail';
import type { InterestRow, GenreInfo } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AudienceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [audienceResult, genresResult, interestsResult, outputsResult] = await Promise.all([
    supabase.from('audiences').select('*').eq('id', id).single(),
    supabase.from('genres').select('genre_slug, genre_name, genre_categories').order('genre_name'),
    supabase.from('respondent_genre_interest').select('respondent_id, genre_slug, interest_level'),
    supabase
      .from('saved_outputs')
      .select('id, output_type, title, rya_score, channel, created_at')
      .eq('audience_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (audienceResult.error || !audienceResult.data) notFound();
  if (genresResult.error || interestsResult.error || outputsResult.error) {
    throw new Error("Failed to load audience detail data");
  }

  const audience = audienceResult.data;
  const allInterests = interestsResult.data as InterestRow[];
  const allGenres = genresResult.data as GenreInfo[];

  const segmentSignals = getGenreSignals(audience.respondent_ids, allInterests, allGenres);
  const populationSignals = getPopulationAverages(allInterests, allGenres);
  const deltas = computeDeltas(segmentSignals, populationSignals);

  return (
    <AudienceDetail
      audience={audience}
      deltas={deltas}
      segmentSignals={segmentSignals}
      savedOutputs={outputsResult.data}
    />
  );
}
