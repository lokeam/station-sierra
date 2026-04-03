import { createServiceClient } from "@/lib/supabase";
import { RespondentExplorer } from "../components/respondent-explorer";

export default async function RespondentsPage() {
  const supabase = createServiceClient();

  const [
    { data: respondents },
    { data: genres },
    { data: interests },
  ] = await Promise.all([
    supabase.from("respondents").select("respondent_id").order("respondent_id"),
    supabase.from("genres").select("genre_slug, genre_name").order("genre_name"),
    supabase
      .from("respondent_genre_interest")
      .select("respondent_id, genre_slug, interest_level"),
  ]);

  const respondentIds = (respondents ?? []).map((r) => r.respondent_id);

  return (
    <RespondentExplorer
      respondentIds={respondentIds}
      genres={genres ?? []}
      interests={interests ?? []}
    />
  );
}
