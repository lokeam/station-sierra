'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NewAudienceModal } from './new-audience-modal';

interface GenreSignal {
  genre_name: string;
  genre_slug: string;
  avg_score: number;
}

interface Audience {
  id: string;
  name: string;
  respondent_ids: number[];
  created_at: string;
}

interface Genre {
  genre_slug: string;
  genre_name: string;
}

interface InterestRow {
  respondent_id: number;
  genre_slug: string;
  interest_level: number;
}

interface AudienceListProps {
  audiences: Audience[];
  genres: Genre[];
  interests: InterestRow[];
}

function getTopGenres(
  respondentIds: number[],
  interests: InterestRow[],
  genres: Genre[],
): GenreSignal[] {
  if (respondentIds.length === 0) return [];
  const idSet = new Set(respondentIds);
  const filtered = interests.filter((r) => idSet.has(r.respondent_id));
  const slugToName = new Map(genres.map((g) => [g.genre_slug, g.genre_name]));
  const sums = new Map<string, { total: number; count: number }>();

  for (const row of filtered) {
    const entry = sums.get(row.genre_slug) ?? { total: 0, count: 0 };
    entry.total += row.interest_level;
    entry.count += 1;
    sums.set(row.genre_slug, entry);
  }

  const signals: GenreSignal[] = [];
  for (const [slug, { total, count }] of sums) {
    signals.push({
      genre_name: slugToName.get(slug) ?? slug,
      genre_slug: slug,
      avg_score: parseFloat((total / count).toFixed(2)),
    });
  }

  return signals.sort((a, b) => a.avg_score - b.avg_score).slice(0, 4);
}

export function AudienceList({ audiences, genres, interests }: AudienceListProps) {
  const [showModal, setShowModal] = useState(false);

  if (audiences.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 text-muted-foreground">&#9673;</div>
          <h2 className="text-lg font-semibold mb-2">No audiences yet.</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Build a segment from respondent data to get started.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Create Your First Audience
          </button>
        </div>

        {showModal && (
          <NewAudienceModal
            genres={genres}
            interests={interests}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Audiences</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {audiences.length} saved audience{audiences.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New Audience
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {audiences.map((audience) => {
          const topGenres = getTopGenres(audience.respondent_ids, interests, genres);
          return (
            <div
              key={audience.id}
              className="border border-border rounded-lg p-5 bg-background hover:border-primary/30 transition-colors"
            >
              <h3 className="font-semibold text-sm mb-1">{audience.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                {audience.respondent_ids.length} respondent{audience.respondent_ids.length !== 1 ? 's' : ''}
              </p>

              {topGenres.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Top Genres
                  </p>
                  <div className="space-y-1">
                    {topGenres.map((g) => (
                      <div key={g.genre_slug} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">&#8226;</span>
                        <span className="truncate flex-1">{g.genre_name}</span>
                        <span className="font-mono text-muted-foreground text-xs">{g.avg_score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Link
                  href={`/audiences/${audience.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Explore
                </Link>
                <Link
                  href={`/audiences/${audience.id}`}
                  className="text-sm text-muted-foreground hover:text-primary ml-2"
                  title="Generate concept"
                >
                  &#10022;
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <NewAudienceModal
          genres={genres}
          interests={interests}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
