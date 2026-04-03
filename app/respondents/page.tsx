import { createServiceClient } from "@/lib/supabase";
import { RespondentExplorer } from "../components/respondent-explorer";

export default async function RespondentsPage() {
  const supabase = createServiceClient();

  const [respondentsResult, genresResult, interestsResult] = await Promise.all([
    supabase.from("respondents").select("respondent_id").order("respondent_id"),
    supabase.from("genres").select("genre_slug, genre_name").order("genre_name"),
    supabase
      .from("respondent_genre_interest")
      .select("respondent_id, genre_slug, interest_level"),
  ]);

  if (respondentsResult.error || genresResult.error || interestsResult.error) {
    throw new Error("Failed to load respondent data");
  }

  const respondentIds = respondentsResult.data.map((r) => r.respondent_id);
  const genres = genresResult.data;
  const interests = interestsResult.data;

  return (
    <RespondentExplorer
      respondentIds={respondentIds}
      genres={genres}
      interests={interests}
    />
  );
}
