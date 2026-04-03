import { Sidebar } from "../components/sidebar";
import { createServiceClient } from "@/lib/supabase";

async function getCounts() {
  try {
    const supabase = createServiceClient();
    const [respondentsResult, genresResult] = await Promise.all([
      supabase.from("respondents").select("*", { count: "exact", head: true }),
      supabase.from("genres").select("*", { count: "exact", head: true }),
    ]);
    return {
      respondentCount: respondentsResult.error
        ? 0
        : (respondentsResult.count ?? 0),
      genreCount: genresResult.error ? 0 : (genresResult.count ?? 0),
    };
  } catch {
    return { respondentCount: 0, genreCount: 0 };
  }
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { respondentCount, genreCount } = await getCounts();

  return (
    <div className="flex h-full">
      <Sidebar respondentCount={respondentCount} genreCount={genreCount} />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
