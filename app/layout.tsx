import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "./components/sidebar";
import { createServiceClient } from "@/lib/supabase";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RYA Lite",
  description: "Audience intelligence and AI-powered campaign generation",
};

async function getCounts() {
  try {
    const supabase = createServiceClient();
    const [respondentsResult, genresResult] = await Promise.all([
      supabase.from("respondents").select("*", { count: "exact", head: true }),
      supabase.from("genres").select("*", { count: "exact", head: true }),
    ]);
    return {
      respondentCount: respondentsResult.error ? 0 : (respondentsResult.count ?? 0),
      genreCount: genresResult.error ? 0 : (genresResult.count ?? 0),
    };
  } catch {
    return { respondentCount: 0, genreCount: 0 };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { respondentCount, genreCount } = await getCounts();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="h-full flex">
        <Sidebar respondentCount={respondentCount} genreCount={genreCount} />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
