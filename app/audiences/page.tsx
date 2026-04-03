import { createServiceClient } from '@/lib/supabase';
import { AudienceList } from '../components/audience-list';

export default async function AudiencesPage() {
  const supabase = createServiceClient();

  const [
    { data: audiences },
    { data: genres },
    { data: interests },
  ] = await Promise.all([
    supabase.from('audiences').select('id, name, respondent_ids, created_at').order('created_at', { ascending: false }),
    supabase.from('genres').select('genre_slug, genre_name').order('genre_name'),
    supabase.from('respondent_genre_interest').select('respondent_id, genre_slug, interest_level'),
  ]);

  return (
    <AudienceList
      audiences={audiences ?? []}
      genres={genres ?? []}
      interests={interests ?? []}
    />
  );
}
