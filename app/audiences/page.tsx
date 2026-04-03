import { createServiceClient } from '@/lib/supabase';
import { AudienceList } from '../components/audience-list';

export default async function AudiencesPage() {
  const supabase = createServiceClient();

  const [audiencesResult, genresResult, interestsResult] = await Promise.all([
    supabase.from('audiences').select('id, name, respondent_ids, created_at').order('created_at', { ascending: false }),
    supabase.from('genres').select('genre_slug, genre_name').order('genre_name'),
    supabase.from('respondent_genre_interest').select('respondent_id, genre_slug, interest_level'),
  ]);

  if (audiencesResult.error || genresResult.error || interestsResult.error) {
    throw new Error("Failed to load audience data");
  }

  return (
    <AudienceList
      audiences={audiencesResult.data}
      genres={genresResult.data}
      interests={interestsResult.data}
    />
  );
}
