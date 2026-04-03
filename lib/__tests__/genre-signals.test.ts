import { describe, it, expect } from 'vitest'
import {
  getGenreSignals,
  getPopulationAverages,
  computeDeltas,
  resolveAudience,
} from '../genre-signals'
import type { InterestRow, GenreInfo } from '../types'

// ── Fixture data from CSVs ──────────────────────────────────────

const GENRES: GenreInfo[] = [
  { genre_slug: 'RQ.2.34', genre_name: 'Coding / Robotics', genre_categories: 'Continuing Ed' },
  { genre_slug: 'RQ.2.38', genre_name: 'Cooking / Baking / Grilling', genre_categories: 'Food & Drink' },
  { genre_slug: 'RQ.2.48', genre_name: 'Documentary', genre_categories: 'Entertainment' },
  { genre_slug: 'RQ.2.57', genre_name: 'Fantasy Sports', genre_categories: 'Sports|Gaming' },
  { genre_slug: 'RQ.2.78', genre_name: 'How-To Content', genre_categories: 'Continuing Ed|Entertainment|Hobby' },
  { genre_slug: 'RQ.2.97', genre_name: 'Meditation', genre_categories: 'Personal Care' },
  { genre_slug: 'RQ.2.125', genre_name: 'Reality programming / Reality TV', genre_categories: 'Entertainment' },
  { genre_slug: 'RQ.2.162', genre_name: 'Travel & tourism content', genre_categories: 'Entertainment|Travel' },
  { genre_slug: 'RQ.2.172', genre_name: 'Wine', genre_categories: 'Food & Drink' },
  { genre_slug: 'RQ.2.173', genre_name: 'Yoga / Pilates', genre_categories: 'Sports|Personal Care' },
]

// All 120 rows from respondent_genre_interest.csv
const ALL_INTERESTS: InterestRow[] = [
  // Respondent 1001
  { respondent_id: 1001, genre_slug: 'RQ.2.34', interest_level: 1 },
  { respondent_id: 1001, genre_slug: 'RQ.2.38', interest_level: 3 },
  { respondent_id: 1001, genre_slug: 'RQ.2.48', interest_level: 2 },
  { respondent_id: 1001, genre_slug: 'RQ.2.57', interest_level: 5 },
  { respondent_id: 1001, genre_slug: 'RQ.2.78', interest_level: 1 },
  { respondent_id: 1001, genre_slug: 'RQ.2.97', interest_level: 3 },
  { respondent_id: 1001, genre_slug: 'RQ.2.125', interest_level: 5 },
  { respondent_id: 1001, genre_slug: 'RQ.2.162', interest_level: 2 },
  { respondent_id: 1001, genre_slug: 'RQ.2.172', interest_level: 4 },
  { respondent_id: 1001, genre_slug: 'RQ.2.173', interest_level: 3 },
  // Respondent 1002
  { respondent_id: 1002, genre_slug: 'RQ.2.34', interest_level: 1 },
  { respondent_id: 1002, genre_slug: 'RQ.2.38', interest_level: 3 },
  { respondent_id: 1002, genre_slug: 'RQ.2.48', interest_level: 1 },
  { respondent_id: 1002, genre_slug: 'RQ.2.57', interest_level: 4 },
  { respondent_id: 1002, genre_slug: 'RQ.2.78', interest_level: 1 },
  { respondent_id: 1002, genre_slug: 'RQ.2.97', interest_level: 4 },
  { respondent_id: 1002, genre_slug: 'RQ.2.125', interest_level: 5 },
  { respondent_id: 1002, genre_slug: 'RQ.2.162', interest_level: 2 },
  { respondent_id: 1002, genre_slug: 'RQ.2.172', interest_level: 3 },
  { respondent_id: 1002, genre_slug: 'RQ.2.173', interest_level: 4 },
  // Respondent 1003
  { respondent_id: 1003, genre_slug: 'RQ.2.34', interest_level: 2 },
  { respondent_id: 1003, genre_slug: 'RQ.2.38', interest_level: 3 },
  { respondent_id: 1003, genre_slug: 'RQ.2.48', interest_level: 2 },
  { respondent_id: 1003, genre_slug: 'RQ.2.57', interest_level: 5 },
  { respondent_id: 1003, genre_slug: 'RQ.2.78', interest_level: 1 },
  { respondent_id: 1003, genre_slug: 'RQ.2.97', interest_level: 3 },
  { respondent_id: 1003, genre_slug: 'RQ.2.125', interest_level: 4 },
  { respondent_id: 1003, genre_slug: 'RQ.2.162', interest_level: 1 },
  { respondent_id: 1003, genre_slug: 'RQ.2.172', interest_level: 3 },
  { respondent_id: 1003, genre_slug: 'RQ.2.173', interest_level: 3 },
  // Respondent 1004
  { respondent_id: 1004, genre_slug: 'RQ.2.34', interest_level: 4 },
  { respondent_id: 1004, genre_slug: 'RQ.2.38', interest_level: 1 },
  { respondent_id: 1004, genre_slug: 'RQ.2.48', interest_level: 2 },
  { respondent_id: 1004, genre_slug: 'RQ.2.57', interest_level: 5 },
  { respondent_id: 1004, genre_slug: 'RQ.2.78', interest_level: 2 },
  { respondent_id: 1004, genre_slug: 'RQ.2.97', interest_level: 1 },
  { respondent_id: 1004, genre_slug: 'RQ.2.125', interest_level: 4 },
  { respondent_id: 1004, genre_slug: 'RQ.2.162', interest_level: 2 },
  { respondent_id: 1004, genre_slug: 'RQ.2.172', interest_level: 3 },
  { respondent_id: 1004, genre_slug: 'RQ.2.173', interest_level: 1 },
  // Respondent 1005
  { respondent_id: 1005, genre_slug: 'RQ.2.34', interest_level: 4 },
  { respondent_id: 1005, genre_slug: 'RQ.2.38', interest_level: 2 },
  { respondent_id: 1005, genre_slug: 'RQ.2.48', interest_level: 3 },
  { respondent_id: 1005, genre_slug: 'RQ.2.57', interest_level: 4 },
  { respondent_id: 1005, genre_slug: 'RQ.2.78', interest_level: 2 },
  { respondent_id: 1005, genre_slug: 'RQ.2.97', interest_level: 1 },
  { respondent_id: 1005, genre_slug: 'RQ.2.125', interest_level: 4 },
  { respondent_id: 1005, genre_slug: 'RQ.2.162', interest_level: 2 },
  { respondent_id: 1005, genre_slug: 'RQ.2.172', interest_level: 3 },
  { respondent_id: 1005, genre_slug: 'RQ.2.173', interest_level: 1 },
  // Respondent 1006
  { respondent_id: 1006, genre_slug: 'RQ.2.34', interest_level: 3 },
  { respondent_id: 1006, genre_slug: 'RQ.2.38', interest_level: 1 },
  { respondent_id: 1006, genre_slug: 'RQ.2.48', interest_level: 2 },
  { respondent_id: 1006, genre_slug: 'RQ.2.57', interest_level: 5 },
  { respondent_id: 1006, genre_slug: 'RQ.2.78', interest_level: 2 },
  { respondent_id: 1006, genre_slug: 'RQ.2.97', interest_level: 1 },
  { respondent_id: 1006, genre_slug: 'RQ.2.125', interest_level: 4 },
  { respondent_id: 1006, genre_slug: 'RQ.2.162', interest_level: 2 },
  { respondent_id: 1006, genre_slug: 'RQ.2.172', interest_level: 2 },
  { respondent_id: 1006, genre_slug: 'RQ.2.173', interest_level: 1 },
  // Respondent 1007
  { respondent_id: 1007, genre_slug: 'RQ.2.34', interest_level: 4 },
  { respondent_id: 1007, genre_slug: 'RQ.2.38', interest_level: 3 },
  { respondent_id: 1007, genre_slug: 'RQ.2.48', interest_level: 3 },
  { respondent_id: 1007, genre_slug: 'RQ.2.57', interest_level: 1 },
  { respondent_id: 1007, genre_slug: 'RQ.2.78', interest_level: 3 },
  { respondent_id: 1007, genre_slug: 'RQ.2.97', interest_level: 5 },
  { respondent_id: 1007, genre_slug: 'RQ.2.125', interest_level: 1 },
  { respondent_id: 1007, genre_slug: 'RQ.2.162', interest_level: 2 },
  { respondent_id: 1007, genre_slug: 'RQ.2.172', interest_level: 4 },
  { respondent_id: 1007, genre_slug: 'RQ.2.173', interest_level: 5 },
  // Respondent 1008
  { respondent_id: 1008, genre_slug: 'RQ.2.34', interest_level: 4 },
  { respondent_id: 1008, genre_slug: 'RQ.2.38', interest_level: 2 },
  { respondent_id: 1008, genre_slug: 'RQ.2.48', interest_level: 3 },
  { respondent_id: 1008, genre_slug: 'RQ.2.57', interest_level: 1 },
  { respondent_id: 1008, genre_slug: 'RQ.2.78', interest_level: 3 },
  { respondent_id: 1008, genre_slug: 'RQ.2.97', interest_level: 4 },
  { respondent_id: 1008, genre_slug: 'RQ.2.125', interest_level: 2 },
  { respondent_id: 1008, genre_slug: 'RQ.2.162', interest_level: 2 },
  { respondent_id: 1008, genre_slug: 'RQ.2.172', interest_level: 4 },
  { respondent_id: 1008, genre_slug: 'RQ.2.173', interest_level: 4 },
  // Respondent 1009
  { respondent_id: 1009, genre_slug: 'RQ.2.34', interest_level: 5 },
  { respondent_id: 1009, genre_slug: 'RQ.2.38', interest_level: 3 },
  { respondent_id: 1009, genre_slug: 'RQ.2.48', interest_level: 4 },
  { respondent_id: 1009, genre_slug: 'RQ.2.57', interest_level: 1 },
  { respondent_id: 1009, genre_slug: 'RQ.2.78', interest_level: 4 },
  { respondent_id: 1009, genre_slug: 'RQ.2.97', interest_level: 5 },
  { respondent_id: 1009, genre_slug: 'RQ.2.125', interest_level: 2 },
  { respondent_id: 1009, genre_slug: 'RQ.2.162', interest_level: 3 },
  { respondent_id: 1009, genre_slug: 'RQ.2.172', interest_level: 5 },
  { respondent_id: 1009, genre_slug: 'RQ.2.173', interest_level: 5 },
  // Respondent 1010
  { respondent_id: 1010, genre_slug: 'RQ.2.34', interest_level: 4 },
  { respondent_id: 1010, genre_slug: 'RQ.2.38', interest_level: 2 },
  { respondent_id: 1010, genre_slug: 'RQ.2.48', interest_level: 1 },
  { respondent_id: 1010, genre_slug: 'RQ.2.57', interest_level: 5 },
  { respondent_id: 1010, genre_slug: 'RQ.2.78', interest_level: 3 },
  { respondent_id: 1010, genre_slug: 'RQ.2.97', interest_level: 2 },
  { respondent_id: 1010, genre_slug: 'RQ.2.125', interest_level: 4 },
  { respondent_id: 1010, genre_slug: 'RQ.2.162', interest_level: 1 },
  { respondent_id: 1010, genre_slug: 'RQ.2.172', interest_level: 1 },
  { respondent_id: 1010, genre_slug: 'RQ.2.173', interest_level: 3 },
  // Respondent 1011
  { respondent_id: 1011, genre_slug: 'RQ.2.34', interest_level: 3 },
  { respondent_id: 1011, genre_slug: 'RQ.2.38', interest_level: 2 },
  { respondent_id: 1011, genre_slug: 'RQ.2.48', interest_level: 1 },
  { respondent_id: 1011, genre_slug: 'RQ.2.57', interest_level: 5 },
  { respondent_id: 1011, genre_slug: 'RQ.2.78', interest_level: 2 },
  { respondent_id: 1011, genre_slug: 'RQ.2.97', interest_level: 3 },
  { respondent_id: 1011, genre_slug: 'RQ.2.125', interest_level: 4 },
  { respondent_id: 1011, genre_slug: 'RQ.2.162', interest_level: 1 },
  { respondent_id: 1011, genre_slug: 'RQ.2.172', interest_level: 1 },
  { respondent_id: 1011, genre_slug: 'RQ.2.173', interest_level: 3 },
  // Respondent 1012
  { respondent_id: 1012, genre_slug: 'RQ.2.34', interest_level: 4 },
  { respondent_id: 1012, genre_slug: 'RQ.2.38', interest_level: 1 },
  { respondent_id: 1012, genre_slug: 'RQ.2.48', interest_level: 1 },
  { respondent_id: 1012, genre_slug: 'RQ.2.57', interest_level: 5 },
  { respondent_id: 1012, genre_slug: 'RQ.2.78', interest_level: 3 },
  { respondent_id: 1012, genre_slug: 'RQ.2.97', interest_level: 2 },
  { respondent_id: 1012, genre_slug: 'RQ.2.125', interest_level: 3 },
  { respondent_id: 1012, genre_slug: 'RQ.2.162', interest_level: 1 },
  { respondent_id: 1012, genre_slug: 'RQ.2.172', interest_level: 1 },
  { respondent_id: 1012, genre_slug: 'RQ.2.173', interest_level: 2 },
]

// ── Helper ──────────────────────────────────────────────────────

function findSignal(signals: { genre_slug: string; avg_score: number }[], slug: string) {
  return signals.find((s) => s.genre_slug === slug)
}

// ── getGenreSignals ─────────────────────────────────────────────

describe('getGenreSignals', () => {
  it('computes correct averages for Emerging Tech Professionals (1001-1003)', () => {
    const signals = getGenreSignals([1001, 1002, 1003], ALL_INTERESTS, GENRES)

    expect(findSignal(signals, 'RQ.2.78')?.avg_score).toBe(1.0)   // How-To Content
    expect(findSignal(signals, 'RQ.2.34')?.avg_score).toBe(1.33)  // Coding / Robotics
    expect(findSignal(signals, 'RQ.2.48')?.avg_score).toBe(1.67)  // Documentary
    expect(findSignal(signals, 'RQ.2.162')?.avg_score).toBe(1.67) // Travel
  })

  it('computes correct averages for Wellness-Oriented Parents (1004-1006)', () => {
    const signals = getGenreSignals([1004, 1005, 1006], ALL_INTERESTS, GENRES)

    expect(findSignal(signals, 'RQ.2.97')?.avg_score).toBe(1.0)   // Meditation
    expect(findSignal(signals, 'RQ.2.173')?.avg_score).toBe(1.0)  // Yoga
    expect(findSignal(signals, 'RQ.2.38')?.avg_score).toBe(1.33)  // Cooking
    expect(findSignal(signals, 'RQ.2.162')?.avg_score).toBe(2.0)  // Travel
    expect(findSignal(signals, 'RQ.2.78')?.avg_score).toBe(2.0)   // How-To
  })

  it('computes correct averages for Competitive Sports Fans (1007-1009)', () => {
    const signals = getGenreSignals([1007, 1008, 1009], ALL_INTERESTS, GENRES)

    expect(findSignal(signals, 'RQ.2.57')?.avg_score).toBe(1.0)   // Fantasy Sports
    expect(findSignal(signals, 'RQ.2.125')?.avg_score).toBe(1.67) // Reality TV
  })

  it('computes correct averages for Affluent Culture Seekers (1010-1012)', () => {
    const signals = getGenreSignals([1010, 1011, 1012], ALL_INTERESTS, GENRES)

    expect(findSignal(signals, 'RQ.2.48')?.avg_score).toBe(1.0)   // Documentary
    expect(findSignal(signals, 'RQ.2.172')?.avg_score).toBe(1.0)  // Wine
    expect(findSignal(signals, 'RQ.2.162')?.avg_score).toBe(1.0)  // Travel
    expect(findSignal(signals, 'RQ.2.38')?.avg_score).toBe(1.67)  // Cooking
  })

  it('returns results sorted ASC by avg_score (most interested first)', () => {
    const signals = getGenreSignals([1001, 1002, 1003], ALL_INTERESTS, GENRES)
    for (let i = 1; i < signals.length; i++) {
      expect(signals[i].avg_score).toBeGreaterThanOrEqual(signals[i - 1].avg_score)
    }
  })

  it('returns empty array for empty respondent set', () => {
    const signals = getGenreSignals([], ALL_INTERESTS, GENRES)
    expect(signals).toEqual([])
  })

  it('works for a single respondent', () => {
    const signals = getGenreSignals([1001], ALL_INTERESTS, GENRES)
    expect(findSignal(signals, 'RQ.2.34')?.avg_score).toBe(1)  // Coding
    expect(findSignal(signals, 'RQ.2.57')?.avg_score).toBe(5)  // Fantasy Sports
    expect(signals).toHaveLength(10)
  })
})

// ── getPopulationAverages ───────────────────────────────────────

describe('getPopulationAverages', () => {
  it('matches pre-computed population averages from data-model.md', () => {
    const pop = getPopulationAverages(ALL_INTERESTS, GENRES)

    expect(findSignal(pop, 'RQ.2.162')?.avg_score).toBe(1.75) // Travel
    expect(findSignal(pop, 'RQ.2.48')?.avg_score).toBe(2.08)  // Documentary
    expect(findSignal(pop, 'RQ.2.38')?.avg_score).toBe(2.17)  // Cooking
    expect(findSignal(pop, 'RQ.2.78')?.avg_score).toBe(2.25)  // How-To
    expect(findSignal(pop, 'RQ.2.97')?.avg_score).toBe(2.83)  // Meditation
    expect(findSignal(pop, 'RQ.2.172')?.avg_score).toBe(2.83) // Wine
    expect(findSignal(pop, 'RQ.2.173')?.avg_score).toBe(2.92) // Yoga
    expect(findSignal(pop, 'RQ.2.34')?.avg_score).toBe(3.25)  // Coding
    expect(findSignal(pop, 'RQ.2.125')?.avg_score).toBe(3.5)  // Reality TV
    expect(findSignal(pop, 'RQ.2.57')?.avg_score).toBe(3.83)  // Fantasy Sports
  })
})

// ── computeDeltas ───────────────────────────────────────────────

describe('computeDeltas', () => {
  it('produces correct delta values for Emerging Tech Professionals', () => {
    const segment = getGenreSignals([1001, 1002, 1003], ALL_INTERESTS, GENRES)
    const pop = getPopulationAverages(ALL_INTERESTS, GENRES)
    const deltas = computeDeltas(segment, pop)

    const codingDelta = deltas.find((d) => d.genre_slug === 'RQ.2.34')!
    // pop 3.25 - segment 1.33 = 1.92
    expect(codingDelta.delta).toBe(1.92)
    expect(codingDelta.direction).toBe('▲ significantly more interested')

    const howToDelta = deltas.find((d) => d.genre_slug === 'RQ.2.78')!
    // pop 2.25 - segment 1.0 = 1.25
    expect(howToDelta.delta).toBe(1.25)
    expect(howToDelta.direction).toBe('▲ significantly more interested')
  })

  it('labels directions correctly across all thresholds', () => {
    const segment = getGenreSignals([1001, 1002, 1003], ALL_INTERESTS, GENRES)
    const pop = getPopulationAverages(ALL_INTERESTS, GENRES)
    const deltas = computeDeltas(segment, pop)

    // Travel: pop 1.75 - segment 1.67 = 0.08 → similar
    const travel = deltas.find((d) => d.genre_slug === 'RQ.2.162')!
    expect(travel.direction).toBe('≈ similar')

    // Documentary: pop 2.08 - segment 1.67 = 0.41 → more interested
    const doc = deltas.find((d) => d.genre_slug === 'RQ.2.48')!
    expect(doc.direction).toBe('▲ more interested')

    // Meditation: pop 2.83 - segment 3.33 = -0.5 → less interested
    const med = deltas.find((d) => d.genre_slug === 'RQ.2.97')!
    expect(med.delta).toBe(-0.5)
    expect(med.direction).toBe('▼ less interested')
  })

  it('handles Competitive Sports Fans with strong signals', () => {
    const segment = getGenreSignals([1007, 1008, 1009], ALL_INTERESTS, GENRES)
    const pop = getPopulationAverages(ALL_INTERESTS, GENRES)
    const deltas = computeDeltas(segment, pop)

    // Fantasy Sports: pop 3.83 - segment 1.0 = 2.83
    const fantasy = deltas.find((d) => d.genre_slug === 'RQ.2.57')!
    expect(fantasy.delta).toBe(2.83)
    expect(fantasy.direction).toBe('▲ significantly more interested')

    // Reality TV: pop 3.5 - segment 1.67 = 1.83
    const reality = deltas.find((d) => d.genre_slug === 'RQ.2.125')!
    expect(reality.delta).toBe(1.83)
    expect(reality.direction).toBe('▲ significantly more interested')
  })
})

// ── resolveAudience ─────────────────────────────────────────────

describe('resolveAudience', () => {
  it('returns only [1001, 1002, 1003] for How-To Content max_level 1', () => {
    const result = resolveAudience(
      { filters: [{ genre_slug: 'RQ.2.78', max_level: 1 }] },
      ALL_INTERESTS
    )
    expect(result).toEqual([1001, 1002, 1003])
  })

  it('applies AND logic across multiple filters', () => {
    // Cooking <= 2 AND Meditation <= 1 → Wellness cluster only
    const result = resolveAudience(
      {
        filters: [
          { genre_slug: 'RQ.2.38', max_level: 2 },
          { genre_slug: 'RQ.2.97', max_level: 1 },
        ],
      },
      ALL_INTERESTS
    )
    expect(result).toEqual([1004, 1005, 1006])
  })

  it('returns Fantasy Sports cluster with max_level 1', () => {
    const result = resolveAudience(
      { filters: [{ genre_slug: 'RQ.2.57', max_level: 1 }] },
      ALL_INTERESTS
    )
    expect(result).toEqual([1007, 1008, 1009])
  })

  it('returns Affluent Culture Seekers with Documentary + Wine max_level 1', () => {
    const result = resolveAudience(
      {
        filters: [
          { genre_slug: 'RQ.2.48', max_level: 1 },
          { genre_slug: 'RQ.2.172', max_level: 1 },
        ],
      },
      ALL_INTERESTS
    )
    expect(result).toEqual([1010, 1011, 1012])
  })

  it('returns all respondents when no filters are specified', () => {
    const result = resolveAudience({ filters: [] }, ALL_INTERESTS)
    expect(result).toEqual([1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012])
  })

  it('returns empty array when filter matches nobody', () => {
    // Nobody has Coding at level 1 AND Fantasy Sports at level 1
    const result = resolveAudience(
      {
        filters: [
          { genre_slug: 'RQ.2.34', max_level: 1 },
          { genre_slug: 'RQ.2.57', max_level: 1 },
        ],
      },
      ALL_INTERESTS
    )
    expect(result).toEqual([])
  })

  it('returns results sorted by respondent_id', () => {
    const result = resolveAudience(
      { filters: [{ genre_slug: 'RQ.2.162', max_level: 2 }] },
      ALL_INTERESTS
    )
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1])
    }
  })
})
