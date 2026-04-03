'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { resolveAudience } from '@/lib/genre-signals';
import type { FilterDefinition, FilterRule, InterestRow } from '@/lib/types';

interface Genre {
  genre_slug: string;
  genre_name: string;
}

interface NewAudienceModalProps {
  genres: Genre[];
  interests: InterestRow[];
  onClose: () => void;
}

const LEVEL_OPTIONS = [
  { label: 'Highest (= 1)', value: 1 },
  { label: 'Interested (\u2264 2)', value: 2 },
  { label: 'Neutral or above (\u2264 3)', value: 3 },
  { label: 'Any interest (\u2264 4)', value: 4 },
];

export function NewAudienceModal({ genres, interests, onClose }: NewAudienceModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(2);
  const [error, setError] = useState('');

  const filterDef: FilterDefinition = useMemo(() => ({ filters }), [filters]);

  const matchingIds = useMemo(
    () => resolveAudience(filterDef, interests),
    [filterDef, interests],
  );

  const genreMap = useMemo(
    () => new Map(genres.map((g) => [g.genre_slug, g.genre_name])),
    [genres],
  );

  // Genres not already in filters
  const availableGenres = useMemo(
    () => {
      const usedSlugs = new Set(filters.map((f) => f.genre_slug));
      return genres.filter((g) => !usedSlugs.has(g.genre_slug));
    },
    [genres, filters],
  );

  function addFilter() {
    if (!selectedGenre) return;
    setFilters((prev) => [...prev, { genre_slug: selectedGenre, max_level: selectedLevel }]);
    setSelectedGenre('');
    setSelectedLevel(2);
  }

  function removeFilter(index: number) {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  }

  const canSave = name.trim().length > 0 && matchingIds.length > 0 && filters.length > 0;

  async function handleSave() {
    if (!canSave) return;
    setError('');

    try {
      const res = await fetch('/api/audiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          filter_definition: filterDef,
          respondent_ids: matchingIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save audience');
        return;
      }

      startTransition(() => {
        router.refresh();
        onClose();
      });
    } catch {
      setError('Failed to save audience');
    }
  }

  // Get top interests for a respondent (for preview)
  function getTopInterestsForRespondent(respondentId: number): string[] {
    return interests
      .filter((i) => i.respondent_id === respondentId && i.interest_level <= 2)
      .sort((a, b) => a.interest_level - b.interest_level)
      .map((i) => genreMap.get(i.genre_slug) ?? i.genre_slug)
      .map((n) => n.replace(/ \/ /g, '/').replace(/ content$/i, '').replace(/ programming \/ /i, ''))
      .slice(0, 3);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">New Audience</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Audience Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wellness-Oriented Parents"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Filter builder */}
          <div>
            <p className="text-sm font-medium mb-1.5">Interest Filters</p>
            <p className="text-xs text-muted-foreground mb-3">
              Show respondents who are interested in:
            </p>

            <div className="flex gap-2 max-[500px]:flex-col">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select genre...</option>
                {availableGenres.map((g) => (
                  <option key={g.genre_slug} value={g.genre_slug}>
                    {g.genre_name}
                  </option>
                ))}
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(Number(e.target.value))}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={addFilter}
                disabled={!selectedGenre}
                className="px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Add
              </button>
            </div>
          </div>

          {/* Active filters */}
          {filters.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Active Filters
              </p>
              <div className="space-y-1.5">
                {filters.map((f, i) => (
                  <div
                    key={`${f.genre_slug}-${i}`}
                    className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 text-sm"
                  >
                    <span>
                      {genreMap.get(f.genre_slug) ?? f.genre_slug}{' '}
                      <span className="text-muted-foreground">&le; {f.max_level}</span>
                    </span>
                    <button
                      onClick={() => removeFilter(i)}
                      className="text-muted-foreground hover:text-foreground ml-2"
                      aria-label="Remove filter"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matching respondents preview */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Matching Respondents
            </p>
            {filters.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add filters to see matches.</p>
            ) : matchingIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No respondents match these filters.</p>
            ) : (
              <>
                <p className="text-sm mb-2">
                  <span className="font-medium">{matchingIds.length}</span> respondent{matchingIds.length !== 1 ? 's' : ''} match
                </p>
                <div className="space-y-1">
                  {matchingIds.map((id) => {
                    const tops = getTopInterestsForRespondent(id);
                    return (
                      <div key={id} className="flex items-center gap-2 text-sm py-1">
                        <span className="text-primary">&#10003;</span>
                        <span className="font-mono text-muted-foreground">#{id}</span>
                        <span className="text-muted-foreground">
                          {tops.join(' \u00b7 ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isPending}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {isPending ? 'Saving...' : 'Save Audience \u2192'}
          </button>
        </div>
      </div>
    </div>
  );
}
