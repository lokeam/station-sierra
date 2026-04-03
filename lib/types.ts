export interface InterestRow {
  respondent_id: number;
  genre_slug: string;
  interest_level: number;
}

export interface GenreInfo {
  genre_slug: string;
  genre_name: string;
  genre_categories: string;
}

export interface GenreSignal {
  genre_name: string;
  genre_slug: string;
  avg_score: number;
}

export type DirectionLabel =
  | '▲ significantly more interested'
  | '▲ more interested'
  | '≈ similar'
  | '▼ less interested';

export interface DeltaSignal {
  genre_name: string;
  genre_slug: string;
  segment_avg: number;
  population_avg: number;
  delta: number;
  direction: DirectionLabel;
}

export interface FilterRule {
  genre_slug: string;
  max_level: number;
}

export interface FilterDefinition {
  filters: FilterRule[];
}

export interface CampaignConcept {
  title: string;
  concept: string;
  channel: string;
  rya_score: number;
  rya_rationale: string;
  genre_signals_used: GenreSignal[];
}

export interface Persona {
  persona_name: string;
  who_they_are: string;
  what_they_care_about: string[];
  what_does_not_resonate: string[];
  creative_direction: string;
  genre_signals_used: GenreSignal[];
}

export type OutputType = 'campaign_concept' | 'persona';

export interface EvalResult {
  pass: boolean;
  detail: string;
  cited?: string[];
}

export interface RunEvalsResult {
  pass: boolean;
  failedEval: string | null;
  detail: string;
}
