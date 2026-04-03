import type {
  InterestRow,
  GenreInfo,
  GenreSignal,
  DeltaSignal,
  DirectionLabel,
  FilterDefinition,
} from './types'

/**
 * Compute average interest per genre for a set of respondents.
 * Sorted ASC by avg_score (most interested first, since 1 = highest).
 */
export function getGenreSignals(
  respondentIds: number[],
  allInterests: InterestRow[],
  genres: GenreInfo[]
): GenreSignal[] {
  if (respondentIds.length === 0) return []

  const idSet = new Set(respondentIds);
  const filtered = allInterests.filter((r) => idSet.has(r.respondent_id));
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

  return signals.sort((a, b) => a.avg_score - b.avg_score);
}

/**
 * Compute population averages across all respondents.
 * Pass the full interest dataset — computes from all unique respondent IDs.
 */
export function getPopulationAverages(
  allInterests: InterestRow[],
  genres: GenreInfo[]
): GenreSignal[] {
  const allIds = [...new Set(allInterests.map((r) => r.respondent_id))];

  return getGenreSignals(allIds, allInterests, genres);
}

function getDirection(delta: number): DirectionLabel {
  if (delta > 0.5) return '▲ significantly more interested';
  if (delta >= 0.1) return '▲ more interested';
  if (delta > -0.1) return '≈ similar';

  return '▼ less interested';
}

/**
 * Compute deltas between segment and population averages.
 * delta = population_avg - segment_avg
 * Positive delta means the segment is MORE interested (lower score).
 */
export function computeDeltas(
  segmentSignals: GenreSignal[],
  populationSignals: GenreSignal[]
): DeltaSignal[] {
  const popMap = new Map(populationSignals.map((s) => [s.genre_slug, s]));

  return segmentSignals
    .map((seg) => {
      const pop = popMap.get(seg.genre_slug);

      if (!pop) return null;

      const delta = parseFloat((pop.avg_score - seg.avg_score).toFixed(2));

      return {
        genre_name: seg.genre_name,
        genre_slug: seg.genre_slug,
        segment_avg: seg.avg_score,
        population_avg: pop.avg_score,
        delta,
        direction: getDirection(delta),
      }
    })
    .filter((d): d is DeltaSignal => d !== null)
}

/**
 * Resolve a filter definition to matching respondent IDs.
 * AND logic: respondent must satisfy ALL filters.
 * A filter is satisfied if interest_level <= max_level for that genre.
 */
export function resolveAudience(
  filterDef: FilterDefinition,
  allInterests: InterestRow[]
): number[] {
  if (filterDef.filters.length === 0) {
    return [...new Set(allInterests.map((r) => r.respondent_id))].sort(
      (a, b) => a - b
    );
  }

  // Build a lookup: respondent_id -> genre_slug -> interest_level
  const lookup = new Map<number, Map<string, number>>();

  for (const row of allInterests) {
    if (!lookup.has(row.respondent_id)) {
      lookup.set(row.respondent_id, new Map());
    }
    lookup.get(row.respondent_id)!.set(row.genre_slug, row.interest_level);
  }

  const matching: number[] = [];

  for (const [respondentId, genreMap] of lookup) {
    const matchesAll = filterDef.filters.every((filter) => {
      const level = genreMap.get(filter.genre_slug);

      return level !== undefined && level <= filter.max_level;
    })

    if (matchesAll) {
      matching.push(respondentId);
    }
  }

  return matching.sort((a, b) => a - b);
}
