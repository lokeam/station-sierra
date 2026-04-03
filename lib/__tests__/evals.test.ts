import { describe, it, expect } from 'vitest';
import {
  evalSchemaCompliance,
  evalGroundedness,
  evalRYARange,
  runEvals,
} from '../evals';
import type { CampaignConcept, Persona, GenreSignal } from '../types';

// ── Fixture data ───────────────────────────────────────────────

const GENRE_SIGNALS: GenreSignal[] = [
  { genre_name: 'How-To Content', genre_slug: 'RQ.2.78', avg_score: 1.0 },
  { genre_name: 'Coding / Robotics', genre_slug: 'RQ.2.34', avg_score: 1.33 },
  { genre_name: 'Documentary', genre_slug: 'RQ.2.48', avg_score: 1.67 },
  { genre_name: 'Travel & tourism content', genre_slug: 'RQ.2.162', avg_score: 1.67 },
];

const VALID_CONCEPT: CampaignConcept = {
  title: 'Trail and Discovery',
  concept:
    'Built for audiences who index highest on Coding / Robotics' +
    ' and How-To Content -- practical learners who want to explore.',
  channel: 'YouTube',
  rya_score: 6,
  rya_rationale: 'Moderate risk for a Coding / Robotics audience.',
  genre_signals_used: [
    { genre_name: 'Coding / Robotics', genre_slug: 'RQ.2.34', avg_score: 1.33 },
    { genre_name: 'How-To Content', genre_slug: 'RQ.2.78', avg_score: 1.0 },
  ],
};

const VALID_PERSONA: Persona = {
  persona_name: 'The Practical Explorer',
  who_they_are:
    'Self-directed learners drawn to How-To Content and Documentary formats.',
  what_they_care_about: [
    'Learning with immediate application (Coding / Robotics: 1.33)',
    'Authentic exploration over curated travel (Travel & tourism content: 1.67)',
  ],
  what_does_not_resonate: [
    'Entertainment for its own sake (Reality TV: 5.0)',
  ],
  creative_direction:
    'Lead with utility and discovery. This audience responds to How-To Content.',
  genre_signals_used: [
    { genre_name: 'Coding / Robotics', genre_slug: 'RQ.2.34', avg_score: 1.33 },
    { genre_name: 'How-To Content', genre_slug: 'RQ.2.78', avg_score: 1.0 },
  ],
};

// ── evalSchemaCompliance ───────────────────────────────────────

describe('evalSchemaCompliance', () => {
  it('passes with valid campaign concept', () => {
    const result = evalSchemaCompliance(VALID_CONCEPT, 'campaign_concept');
    expect(result.pass).toBe(true);
  });

  it('fails when title is missing', () => {
    const { title: _, ...noTitle } = VALID_CONCEPT;
    const result = evalSchemaCompliance(noTitle, 'campaign_concept');
    expect(result.pass).toBe(false);
    expect(result.detail).toContain('title');
  });

  it('fails when rya_score is out of range', () => {
    const result = evalSchemaCompliance(
      { ...VALID_CONCEPT, rya_score: 11 },
      'campaign_concept'
    );
    expect(result.pass).toBe(false);
    expect(result.detail).toContain('rya_score');
  });

  it('fails when genre_signals_used has fewer than 2 items', () => {
    const result = evalSchemaCompliance(
      { ...VALID_CONCEPT, genre_signals_used: [GENRE_SIGNALS[0]] },
      'campaign_concept'
    );
    expect(result.pass).toBe(false);
    expect(result.detail).toContain('genre_signals_used');
  });

  it('passes with valid persona', () => {
    const result = evalSchemaCompliance(VALID_PERSONA, 'persona');
    expect(result.pass).toBe(true);
  });

  it('fails when persona_name is missing', () => {
    const { persona_name: _, ...noName } = VALID_PERSONA;
    const result = evalSchemaCompliance(noName, 'persona');
    expect(result.pass).toBe(false);
    expect(result.detail).toContain('persona_name');
  });

  it('fails when what_they_care_about has fewer than 2 items', () => {
    const result = evalSchemaCompliance(
      { ...VALID_PERSONA, what_they_care_about: ['one item'] },
      'persona'
    );
    expect(result.pass).toBe(false);
    expect(result.detail).toContain('what_they_care_about');
  });

  it('fails when what_does_not_resonate is empty', () => {
    const result = evalSchemaCompliance(
      { ...VALID_PERSONA, what_does_not_resonate: [] },
      'persona'
    );
    expect(result.pass).toBe(false);
    expect(result.detail).toContain('what_does_not_resonate');
  });

  it('collects multiple errors', () => {
    const result = evalSchemaCompliance({}, 'campaign_concept');
    expect(result.pass).toBe(false);
    expect(result.detail).toContain('title');
    expect(result.detail).toContain('concept');
    expect(result.detail).toContain('channel');
  });
});

// ── evalGroundedness ───────────────────────────────────────────

describe('evalGroundedness', () => {
  it('passes when narrative cites at least 2 genre names', () => {
    const result = evalGroundedness(VALID_CONCEPT, GENRE_SIGNALS);
    expect(result.pass).toBe(true);
    expect(result.cited!.length).toBeGreaterThanOrEqual(2);
  });

  it('fails when narrative has zero genre citations (regression: false-pass bug)', () => {
    const genericOutput: CampaignConcept = {
      title: 'The Bold Campaign',
      concept: 'A campaign that speaks to this unique audience.',
      rya_rationale: 'This concept takes a creative risk.',
      rya_score: 6,
      channel: 'YouTube',
      genre_signals_used: [
        { genre_name: 'Coding / Robotics', genre_slug: 'RQ.2.34', avg_score: 1.0 },
        { genre_name: 'How-To Content', genre_slug: 'RQ.2.78', avg_score: 1.0 },
      ],
    };
    const result = evalGroundedness(genericOutput, GENRE_SIGNALS);
    expect(result.pass).toBe(false);
    expect(result.detail).toContain('only 0 genre(s) cited');
  });

  it('fails when only 1 genre is cited', () => {
    const output: CampaignConcept = {
      ...VALID_CONCEPT,
      concept: 'A campaign grounded in Coding / Robotics interest.',
      rya_rationale: 'A creative risk worth taking.',
      title: 'The Campaign',
    };
    const result = evalGroundedness(output, GENRE_SIGNALS);
    expect(result.pass).toBe(false);
    expect(result.detail).toContain('only 1 genre(s) cited');
  });

  it('passes for persona with genre citations in narrative fields', () => {
    const result = evalGroundedness(VALID_PERSONA, GENRE_SIGNALS);
    expect(result.pass).toBe(true);
  });

  it('is case-insensitive', () => {
    const output: CampaignConcept = {
      ...VALID_CONCEPT,
      concept: 'Focus on coding / robotics and how-to content.',
    };
    const result = evalGroundedness(output, GENRE_SIGNALS);
    expect(result.pass).toBe(true);
  });
});

// ── evalRYARange ───────────────────────────────────────────────

describe('evalRYARange', () => {
  it('passes with score 6', () => {
    const result = evalRYARange(VALID_CONCEPT);
    expect(result.pass).toBe(true);
  });

  it('passes with score 1 (lower bound)', () => {
    const result = evalRYARange({ ...VALID_CONCEPT, rya_score: 1 });
    expect(result.pass).toBe(true);
  });

  it('passes with score 10 (upper bound)', () => {
    const result = evalRYARange({ ...VALID_CONCEPT, rya_score: 10 });
    expect(result.pass).toBe(true);
  });

  it('fails with score 0', () => {
    const result = evalRYARange({ ...VALID_CONCEPT, rya_score: 0 });
    expect(result.pass).toBe(false);
  });

  it('fails with score 11', () => {
    const result = evalRYARange({ ...VALID_CONCEPT, rya_score: 11 });
    expect(result.pass).toBe(false);
  });

  it('fails with non-integer 6.5', () => {
    const result = evalRYARange({ ...VALID_CONCEPT, rya_score: 6.5 });
    expect(result.pass).toBe(false);
  });
});

// ── runEvals ───────────────────────────────────────────────────

describe('runEvals', () => {
  it('passes when all evals pass for campaign_concept', () => {
    const result = runEvals(VALID_CONCEPT, 'campaign_concept', GENRE_SIGNALS);
    expect(result.pass).toBe(true);
    expect(result.failedEval).toBeNull();
  });

  it('passes when all evals pass for persona (RYA skipped)', () => {
    const result = runEvals(VALID_PERSONA, 'persona', GENRE_SIGNALS);
    expect(result.pass).toBe(true);
    expect(result.failedEval).toBeNull();
  });

  it('fails on schema first, before groundedness', () => {
    const result = runEvals({} as CampaignConcept, 'campaign_concept', GENRE_SIGNALS);
    expect(result.pass).toBe(false);
    expect(result.failedEval).toBe('schema');
  });

  it('fails on groundedness when schema passes but narrative is generic', () => {
    const genericOutput: CampaignConcept = {
      title: 'Bold Campaign',
      concept: 'A great campaign for this audience.',
      channel: 'YouTube',
      rya_score: 6,
      rya_rationale: 'A creative risk.',
      genre_signals_used: [
        { genre_name: 'Coding / Robotics', genre_slug: 'RQ.2.34', avg_score: 1.0 },
        { genre_name: 'How-To Content', genre_slug: 'RQ.2.78', avg_score: 1.0 },
      ],
    };
    const result = runEvals(genericOutput, 'campaign_concept', GENRE_SIGNALS);
    expect(result.pass).toBe(false);
    expect(result.failedEval).toBe('groundedness');
  });

  it('skips RYA eval for persona output', () => {
    const result = runEvals(VALID_PERSONA, 'persona', GENRE_SIGNALS);
    expect(result.pass).toBe(true);
    // No rya_score on persona, but runEvals should not check it
  });

  it('schema catches invalid rya_score before rya_range eval runs', () => {
    const badRya: CampaignConcept = { ...VALID_CONCEPT, rya_score: 0 };
    const result = runEvals(badRya, 'campaign_concept', GENRE_SIGNALS);
    expect(result.pass).toBe(false);
    expect(result.failedEval).toBe('schema');
  });
});
