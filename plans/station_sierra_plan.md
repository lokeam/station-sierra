# Plan: Station Sierra

> Source PRD: docs/PRD.md

## Architectural decisions

Durable decisions that apply across all phases:

- **Database**: Supabase (local), 5 tables: `respondents`, `genres`, `respondent_genre_interest`, `audiences`, `saved_outputs`. Storage bucket `card-images` (public).
- **Routes**: `POST /api/generate/concept`, `POST /api/generate/persona`, `POST /api/generate/card-image`
- **LLM**: OpenAI gpt-4o-mini via Vercel AI SDK `generateObject()` — no streaming
- **Observability**: Arize Phoenix (local, port 6006), OTLP protobuf exporter
- **Interest scale**: Inverted (1 = highest interest, 5 = none). All sorts ASC. Bar width = `(6 - interest_level) / 5`. Delta = `population_avg - segment_avg` (positive = more interested).
- **Filter logic**: `FilterDefinition = { filters: [{ genre_slug, max_level }] }`. AND logic — respondent matches if `interest_level <= max_level` for ALL filters.
- **Generation loop**: Generate → evaluate → refine, max 3 attempts. 200 on success, 422 on exhaustion.
- **RLS**: Permissive `allow_all` on all tables and storage (no auth in scope).

---

## Phase 1: Database Layer

**User stories**: 26, 27, 28

### What to build

Supabase migration creating all 5 tables (`respondents`, `genres`, `respondent_genre_interest`, `audiences`, `saved_outputs`) with constraints, RLS policies, and the `card-images` storage bucket. A `seed.sql` that imports the 3 CSV files in `/data` into their respective tables. After `supabase start`, the database is fully populated and ready.

### Acceptance criteria

- [ ] `supabase start` applies migrations and seed without errors
- [ ] `respondents` contains 12 rows (IDs 1001–1012)
- [ ] `genres` contains 10 rows matching genres.csv
- [ ] `respondent_genre_interest` contains 120 rows matching the CSV
- [ ] `audiences` and `saved_outputs` tables exist with correct schemas
- [ ] RLS enabled on all 5 tables with permissive policies
- [ ] `card-images` storage bucket exists and is public
- [ ] Supabase client utility created and env vars documented

---

## Phase 2: Genre Signals Engine

**User stories**: 9, 10, 11

### What to build

A pure-function module (no side effects, no database calls) that computes genre signal aggregations. Four functions: `getGenreSignals` (average interest per genre for a set of respondents), `getPopulationAverages` (averages across all 12 respondents), `computeDeltas` (segment vs population with directional labels), and `resolveAudience` (filter definition → matching respondent IDs). Unit tests using the 4 known audience clusters as fixture data.

### Acceptance criteria

- [ ] `getGenreSignals([1001, 1002, 1003])` returns How-To Content avg 1.0, Coding/Robotics avg 1.33
- [ ] `getPopulationAverages()` matches pre-computed values from data-model.md
- [ ] `computeDeltas` produces correct delta values and directional labels (▲ significantly more, ▲ more, ≈ similar, ▼ less)
- [ ] `resolveAudience({filters: [{genre_slug: "RQ.2.78", max_level: 1}]})` returns only [1001, 1002, 1003]
- [ ] Edge cases tested: empty respondent set, single respondent, filter matching nobody
- [ ] All functions are pure — no database or network calls

---

## Phase 3: Eval Layer

**User stories**: 23, 24

### What to build

Four pure eval functions: `evalSchemaCompliance` (output matches Zod schema), `evalGroundedness` (narrative cites at least one genre name from provided signals), `evalRYARange` (RYA score 1–10 with non-empty rationale, concept only), and `runEvals` (orchestrates applicable evals per output type, returns per-eval pass/fail with reasons). Unit tests with fixture data covering pass and fail cases.

### Acceptance criteria

- [ ] `evalSchemaCompliance` passes with valid output, fails with missing required field
- [ ] `evalGroundedness` passes when narrative contains a genre name from signals, fails when generic
- [ ] `evalRYARange` passes with score 6, fails with score 0 or 11, fails with empty rationale
- [ ] `runEvals` selects correct evals per output_type (RYA skipped for persona)
- [ ] `runEvals` returns structured result with per-eval pass/fail and reasons
- [ ] All functions are pure — no LLM calls needed

---

## Phase 4: AI Generation Route — Concept

**User stories**: 12, 13, 14, 15, 25

### What to build

`POST /api/generate/concept` implementing the full generate → evaluate → refine loop. Accepts `audience_id`, optional `brand_name` and `brief`. On attempt 1: validates request, sanitizes brief, computes genre signals from Supabase, constructs generation prompt, calls `generateObject()`. On attempt 2+: constructs targeted refinement prompt citing the specific failed eval. On all evals pass: saves to `saved_outputs`, returns 200. On max attempts exhausted: returns structured 422. Zod schema enforces output structure (title, concept, channel, rya_score, rya_rationale, genre_signals_used).

### Acceptance criteria

- [ ] Route returns 200 with valid concept JSON when evals pass
- [ ] Concept narrative cites at least one genre name from the audience's signals
- [ ] RYA score is 1–10 with non-empty rationale
- [ ] Brief field is sanitized against prompt injection patterns
- [ ] Refinement prompt on attempt 2+ references the specific failed eval
- [ ] Output saved to `saved_outputs` with correct `output_type`, `audience_id`, and `genre_signals_used`
- [ ] Route returns structured 422 (not 500) when all 3 attempts fail
- [ ] Zod schema matches prompt template exactly

---

## Phase 5: AI Generation Route — Persona

**User stories**: 16, 17, 18

### What to build

`POST /api/generate/persona` implementing the same generate → evaluate → refine loop. Accepts `audience_id` only (no brand/brief). Persona-specific Zod schema (persona_name, who_they_are, what_they_care_about[], what_does_not_resonate[], creative_direction, genre_signals_used). RYA eval skipped. Groundedness eval checks that who_they_are and list items cite genre names.

### Acceptance criteria

- [ ] Route returns 200 with valid persona JSON when evals pass
- [ ] Persona `who_they_are` cites at least one genre name from audience signals
- [ ] `what_they_care_about` and `what_does_not_resonate` arrays cite genre names and scores
- [ ] RYA eval is not applied to persona outputs
- [ ] Output saved to `saved_outputs` with `output_type: 'persona'`
- [ ] Route returns structured 422 when all 3 attempts fail
- [ ] No brand/brief fields accepted or used

---

## Phase 6: Phoenix Instrumentation

**User stories**: 30

### What to build

Arize Phoenix observability on all LLM calls. OTLP exporter configured in `instrumentation.ts` using `@opentelemetry/exporter-trace-otlp-proto` (protobuf, not JSON). Endpoint: `http://localhost:6006/v1/traces`. Every generation attempt produces a span with attributes: `audience_id`, `attempt_number`, per-eval pass/fail results, `output_type`, and sanitization flags (concept route). Failed generations after max_attempts logged as failed spans.

### Acceptance criteria

- [ ] Phoenix running at localhost:6006 shows traces for every LLM call
- [ ] Each span includes `audience_id`, `attempt_number`, `output_type`
- [ ] Eval results (per-eval pass/fail) are span attributes
- [ ] Sanitization flags (`brief_sanitized`, `patterns_matched`) present on concept spans
- [ ] Failed generations (422 responses) appear as failed spans
- [ ] Uses `@opentelemetry/exporter-trace-otlp-proto`, NOT `-http`
- [ ] OTLP endpoint is port 6006, NOT port 4317

---

## Phase 7: Build Gate Verification

**User stories**: (internal quality gate per ai-layer.md)

### What to build

Systematic verification that the AI layer meets all build gate criteria before any UI work begins. Run both routes repeatedly, verify Phoenix traces, and perform manual error analysis. Document findings.

### Acceptance criteria

- [ ] 5 consecutive generations per route pass all evals with no refinement loop triggered
- [ ] A forced failure after max_attempts returns structured 422, not 500
- [ ] Manual review of 10+ Phoenix traces confirms narrative text cites genre names (not just genre_signals_used)
- [ ] At least one clean passing trace documented in README
- [ ] If 100% pass on first attempt, consider whether evals are too easy

---

## Phase 8: Minimum UI — Respondent Explorer

**User stories**: 1, 2, 3

### What to build

App shell with sidebar navigation (Respondents, Audiences, Concepts) and light/dark mode toggle. Respondent table showing all 12 respondents with their top interests (genres where interest_level ≤ 2). Detail panel sliding in from the right showing a respondent's full interest profile as horizontal bars. Bar width uses inverted formula `(6 - interest_level) / 5`. Scale legend ("1 = highest interest, 5 = none") always visible.

### Acceptance criteria

- [ ] App shell with sidebar nav, light/dark toggle
- [ ] Respondent table shows 12 rows with top interests
- [ ] Clicking a respondent opens detail panel with interest bars
- [ ] Bar widths are inverted (score 1 = longest bar)
- [ ] Raw interest_level number shown alongside each bar
- [ ] Scale legend visible on every view showing interest scores
- [ ] Nav footer shows respondent count and genre count from DB

---

## Phase 9: Minimum UI — Audience Builder + Detail

**User stories**: 4, 5, 6, 7, 8, 9, 10, 11

### What to build

Audience list page showing saved audiences as cards with respondent count and top genres. "New Audience" modal with genre + max_level filter form, live preview of matching respondents, and save with name. Audience detail view showing genre interests with dual bars (segment vs population) and delta visualization with directional labels. Segment definition and saved outputs sections.

### Acceptance criteria

- [ ] Audience cards show name, respondent count, top genres with avg scores
- [ ] New Audience modal: genre dropdown, interest level selector, add/remove filters
- [ ] Matching respondents update in real-time as filters change
- [ ] Save disabled until name entered and ≥1 respondent matches
- [ ] Saved audience stores filter_definition (JSONB) and cached respondent_ids
- [ ] Audience detail shows dual bars per genre (segment vs population)
- [ ] Delta values with directional labels (▲ significantly more, ▲ more, ≈ similar, ▼ less)
- [ ] Generate Concept and Generate Persona buttons on audience detail

---

## Phase 10: Minimum UI — Generate + Saved Outputs

**User stories**: 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22

### What to build

Generate panel (slides in from right) with audience selector, type toggle (Campaign/Persona), optional brand/brief fields for campaigns, and genre signal preview. Loading state with animated spinner and rotating phrases. Complete state showing full output with Save and Regenerate buttons. Error state with generic message and retry. Saved outputs list (concepts and personas) with detail views showing genre_signals_used traceability.

### Acceptance criteria

- [ ] Generate panel: audience selector, type toggle, brand/brief fields (campaign only)
- [ ] Signal preview shows top genres when audience selected
- [ ] Loading state: spinner + rotating phrases with shimmer animation
- [ ] Complete state: full output display with RYA bar (concept) or persona fields
- [ ] Save writes to saved_outputs, Regenerate reruns loop without auto-saving
- [ ] Error state: generic message (no eval internals exposed), Try Again and Back buttons
- [ ] Saved outputs list with type badge, audience name, excerpt
- [ ] Detail view shows full output with genre_signals_used section
- [ ] Concept detail: RYA bar with color coding (green 1-3, yellow 4-6, red 7-10)
- [ ] Persona detail: who_they_are, what_they_care_about, what_does_not_resonate, creative_direction

---

## Phase 11: Card Image Generation

**User stories**: 31, 32, 33

### What to build

`POST /api/generate/card-image` route that reads a saved output, uses gpt-4o-mini to write a DALL-E 3 prompt grounded in the output's content and genre signals, generates a 1024x1024 image, uploads to Supabase Storage `card-images` bucket, and updates `saved_outputs` with `card_image_url` and `card_image_prompt`. "Generate Card Image" button on output detail page, image displays inline once generated, DALL-E prompt shown for traceability. Phoenix span per generation.

### Acceptance criteria

- [ ] Route accepts `{ output_id }` and returns updated saved_output with image URL
- [ ] gpt-4o-mini writes DALL-E prompt grounded in output content and genre signals
- [ ] DALL-E 3 generates 1024x1024 image
- [ ] Image uploaded to `card-images` bucket with `{output_id}.png` key
- [ ] `saved_outputs` updated with `card_image_url` and `card_image_prompt`
- [ ] "Generate Card Image" button on detail page, becomes "Regenerate" after first generation
- [ ] DALL-E prompt displayed for traceability
- [ ] Phoenix span with attributes: output_id, output_type, image_size, prompt_length
