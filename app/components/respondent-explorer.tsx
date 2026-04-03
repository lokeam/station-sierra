'use client';

import { useState } from 'react';
import { InterestBar, ScaleLegend } from './interest-bar';

interface Genre {
  genre_slug: string;
  genre_name: string;
}

interface InterestRow {
  respondent_id: number;
  genre_slug: string;
  interest_level: number;
}

interface RespondentExplorerProps {
  respondentIds: number[];
  genres: Genre[];
  interests: InterestRow[];
}

function getTopInterests(
  respondentId: number,
  interests: InterestRow[],
  genres: Genre[],
): string[] {
  const genreMap = new Map(genres.map((g) => [g.genre_slug, g.genre_name]));
  return interests
    .filter((i) => i.respondent_id === respondentId && i.interest_level <= 2)
    .sort((a, b) => a.interest_level - b.interest_level)
    .map((i) => genreMap.get(i.genre_slug) ?? i.genre_slug)
    .map((name) => name.replace(/ \/ /g, '/').replace(/ content$/i, '').replace(/ programming \/ /i, ''));
}

function getFullProfile(
  respondentId: number,
  interests: InterestRow[],
  genres: Genre[],
): { genreName: string; interestLevel: number }[] {
  const genreMap = new Map(genres.map((g) => [g.genre_slug, g.genre_name]));
  return interests
    .filter((i) => i.respondent_id === respondentId)
    .sort((a, b) => a.interest_level - b.interest_level)
    .map((i) => ({
      genreName: genreMap.get(i.genre_slug) ?? i.genre_slug,
      interestLevel: i.interest_level,
    }));
}

export function RespondentExplorer({
  respondentIds,
  genres,
  interests,
}: RespondentExplorerProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const profile = selectedId
    ? getFullProfile(selectedId, interests, genres)
    : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">Respondents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {respondentIds.length} respondents &middot; {genres.length} genres
          </p>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">
                  ID
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Top Interests
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-24">
                  Profile
                </th>
              </tr>
            </thead>
            <tbody>
              {respondentIds.map((id) => {
                const tops = getTopInterests(id, interests, genres);
                const isSelected = selectedId === id;
                return (
                  <tr
                    key={id}
                    className={`border-b border-border last:border-b-0 transition-colors ${
                      isSelected
                        ? 'bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      #{id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {tops.map((name) => (
                          <span
                            key={name}
                            className="inline-block bg-muted text-xs px-2 py-0.5 rounded"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          setSelectedId(isSelected ? null : id)
                        }
                        className="text-primary text-sm hover:underline"
                      >
                        {isSelected ? 'Close' : 'View →'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selectedId && profile && (
        <div className="w-80 shrink-0 border-l border-border bg-background overflow-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">
              Respondent {selectedId}
            </h2>
            <button
              onClick={() => setSelectedId(null)}
              className="text-muted-foreground hover:text-foreground text-lg leading-none"
              aria-label="Close panel"
            >
              &times;
            </button>
          </div>

          <div className="p-4 space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Interest Profile
            </h3>
            {profile.map((item) => (
              <InterestBar
                key={item.genreName}
                genreName={item.genreName}
                interestLevel={item.interestLevel}
              />
            ))}
            <div className="pt-2">
              <ScaleLegend />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
