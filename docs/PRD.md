# PRD: Station Sierra

## Problem Statement

A strategist or marketer at a large company needs to understand who is in a survey audience, discover what genres and topics that audience cares about, and generate creative campaign ideas grounded in those audience signals. Today this requires manually combing through raw survey exports and brainstorming without data backing. The result is slow, subjective, and disconnected from the actual respondent data.

## Solution

Build a lightweight Next.js + Supabase application that lets a marketing user:

1. Browse respondent-level survey data
2. Define and save audience segments by filtering on genre interest levels
3. See aggregated genre insights for any audience, including how the segment differs from the overall population
4. Generate AI-powered campaign concepts and audience personas that are grounded in the segment's actual genre data
5. Save and revisit all generated outputs

Every AI-generated output must cite specific genre data points from the audience. The system uses a generate-evaluate-refine loop to enforce this grounding, with all LLM calls traced in Arize Phoenix for observability.

## User Stories

1. As a marketer, I want to browse all respondents in the dataset, so that I can understand who is in the survey population.
2. As a marketer, I want to see each respondent's genre interest ratings, so that I can understand individual preferences.
3. As a marketer, I want to see interest levels displayed with a clear legend (1 = highest interest), so that I don't misread the inverted scale.
4. As a marketer, I want to create a named audience by adding genre interest filters (e.g., "Coding/Robotics interest <= 2"), so that I can define a target segment.
5. As a marketer, I want to combine multiple genre filters with AND logic, so that I can narrow an audience to people who match all criteria.
6. As a marketer, I want to preview which respondents match my filters before saving, so that I can verify the audience makes sense.
7. As a marketer, I want to save a named audience to Supabase, so that I can reuse it across sessions.
8. As a marketer, I want the audience to store both the filter definition and the resolved respondent IDs, so that queries are fast but the segment logic is preserved.
9. As a marketer, I want to see the top genres for a selected audience ranked by average interest, so that I can identify what they care about most.
10. As a marketer, I want to see a delta visualization comparing my audience's genre interests to the overall population, so that I can identify what makes this segment distinctive.
11. As a marketer, I want deltas labeled with directional indicators (significantly more interested, more interested, similar, less interested), so that I can quickly scan for standout signals.
12. As a marketer, I want to generate a campaign concept for a selected audience, so that I can get creative ideas grounded in data.
13. As a marketer, I want to provide an optional brand name and brief when generating a concept, so that the output is tailored to my context.
14. As a marketer, I want every generated concept to include a title, concept narrative, suggested channel, RYA score (1-10), and RYA rationale, so that I have a complete creative artifact.
15. As a marketer, I want the concept narrative to explicitly cite genre data from the audience, so that I can trust the idea is grounded, not generic.
16. As a marketer, I want to generate an audience persona snapshot, so that I can communicate who this audience is to stakeholders.
17. As a marketer, I want the persona to include a name, who-they-are summary, what-they-care-about list, what-doesn't-resonate list, and creative direction, so that it's actionable.
18. As a marketer, I want persona outputs to cite specific genre names and scores, so that the persona is grounded in real data.
19. As a marketer, I want to regenerate a concept or persona without losing previously saved outputs, so that I can explore variations.
20. As a marketer, I want to save a generated concept or persona to Supabase, so that I can revisit it later.
21. As a marketer, I want to browse all saved outputs (concepts and personas), so that I can review past work.
22. As a marketer, I want to see which genre signals were used to generate each output, so that I can trace the reasoning.
23. As a marketer, I want the system to automatically retry generation up to 3 times if quality checks fail, so that I reliably get usable output.
24. As a marketer, I want a clear error message if generation fails after all retries, so that I know what happened (422, not 500).
25. As a marketer, I want the brief field sanitized against prompt injection, so that the system is not vulnerable to adversarial input.
26. As a reviewer, I want to run `supabase start` and have the database schema and seed data applied automatically, so that I can test the app from a clean checkout.
27. As a reviewer, I want migration files that generate the full schema, so that I can inspect the database design.
28. As a reviewer, I want a seed.sql that imports the provided CSVs, so that I don't need to manually load data.
29. As a reviewer, I want clear README instructions for starting the database and running the application, so that setup takes minutes, not hours.
30. As a reviewer, I want to open Phoenix at localhost:6006 and see traces for every LLM call, so that I can verify observability is working.
31. As a marketer, I want to generate a card image for a saved concept or persona, so that I have a visual artifact to share with stakeholders.
32. As a marketer, I want the card image to reflect the audience's genre signals and creative direction, so that it feels specific to this segment — not generic stock art.
33. As a marketer, I want to see the DALL-E prompt that generated the card image, so that I can trace why the image looks the way it does.

## Implementation Decisions

### Build Order (strict)

1. Database schema and seed data
2. AI generation routes with schema enforcement and eval layer
3. Arize Phoenix instrumentation on all LLM calls
4. Minimum UI to demonstrate AI layer working
5. Full UI only if time remains

The AI reliability layer is the primary deliverable. A polished UI with a shallow AI layer is a failed submission.

### Module Architecture

**Module 1 — Database Layer**
- 5 Supabase tables: `respondents`, `genres`, `respondent_genre_interest`, `audiences`, `saved_outputs`
- Permissive RLS policies on all tables (no auth in scope)
- `seed.sql` imports the 3 provided CSVs (12 respondents, 10 genres, 120 interest rows)
- `respondents` table has `respondent_id` as sole column (CSV has no demographic data)
- `audiences.filter_definition` is JSONB storing filter rules, not static ID lists — extensible when demographics are added
- `audiences.respondent_ids` is a cached integer array computed at save time from filter_definition
- `saved_outputs` stores both campaign concepts and personas via `output_type` discriminator
- `saved_outputs.genre_signals_used` stores the exact genre data injected into the LLM prompt for traceability

**Module 2 — Genre Signals Engine**
- Pure-function module, no side effects, testable with fixture data
- `getGenreSignals(respondentIds: number[]) → GenreSignal[]` — computes average interest per genre for a set of respondents, sorted by interest (ASC = most interested first)
- `getPopulationAverages() → GenreSignal[]` — computes averages across all 12 respondents (can be hardcoded or computed at runtime)
- `computeDeltas(segmentSignals, populationSignals) → DeltaSignal[]` — computes `population_avg - segment_avg` per genre with directional labels
- `resolveAudience(filterDef: FilterDefinition, allInterests: InterestRow[]) → number[]` — resolves filter rules to matching respondent IDs using AND logic
- Delta display thresholds: >0.5 = significantly more interested, 0.1-0.5 = more interested, -0.1 to 0.1 = similar, <-0.5 = less interested

**Module 3 — AI Generation Routes**
- Two POST routes: `/api/generate/concept` and `/api/generate/persona`
- Generate → evaluate → refine loop, max 3 attempts
- Attempt 1: generation prompt with genre_signals interpolated
- Attempt 2+: targeted refinement prompt citing the specific eval that failed
- Brief field sanitized on attempt 1 only (concept route)
- On all evals pass: save to `saved_outputs`, return 200
- On max attempts exhausted: return structured 422 with failure reason
- Model: OpenAI gpt-4o-mini via Vercel AI SDK `generateObject()` — no streaming
- Zod schemas enforce output structure; schemas must match prompt templates exactly

**Module 4 — Eval Layer**
- `evalSchemaCompliance(output, schema)` — validates output matches expected Zod schema
- `evalGroundedness(output, genreSignals)` — verifies narrative text cites at least one genre name from the provided signals
- `evalRYARange(output)` — validates RYA score is 1-10 and rationale is non-empty (concept only)
- `runEvals(output, genreSignals, outputType)` — orchestrates all applicable evals, returns per-eval pass/fail with reasons
- Pure functions, testable with fixture data, no LLM calls needed

**Module 5 — Phoenix Instrumentation**
- OTLP exporter configured in `instrumentation.ts`
- Span attributes: audience_id, attempt number, eval results (per-eval pass/fail), sanitization flags, output_type
- Every LLM call produces a visible trace at localhost:6006
- Failed generations after max_attempts logged as failed spans
- **CRITICAL:** Use `@opentelemetry/exporter-trace-otlp-proto` (protobuf), NOT `@opentelemetry/exporter-trace-otlp-http` (JSON). Phoenix only accepts protobuf on its HTTP endpoint.
- **CRITICAL:** OTLP URL must be `http://localhost:6006/v1/traces` (port 6006, HTTP). Do NOT use port 4317 (gRPC).

**Module 7 — Card Image Generation**
- `POST /api/generate/card-image` accepts `{ output_id: string }`
- Reads the saved output from `saved_outputs`, constructs a prompt-writing request to gpt-4o-mini
- gpt-4o-mini writes a concise DALL-E 3 prompt grounded in the output's content and genre signals
- System prompt: "You write concise DALL-E 3 prompts for marketing card images. Output only the prompt, no explanation. Keep it under 200 words. Avoid text/words in the image."
- Persona prompt inputs: persona_name, who_they_are, what_they_care_about, creative_direction, genre_signals_used
- Concept prompt inputs: title, concept narrative, channel, genre_signals_used
- DALL-E 3 call: 1024x1024 square, single shot (no eval loop)
- Upload image to Supabase Storage `card-images` bucket (public)
- Update `saved_outputs` with `card_image_url` and `card_image_prompt`
- Single Phoenix span per generation with attributes: output_id, output_type, image_size, prompt_length
- On-demand only — triggered by "Generate Card Image" button on output detail page

**Module 6 — UI Layer**
- Respondent Explorer: table of respondents with genre interest bars (bar width = (6 - interest_level) / 5, legend always visible)
- Audience Builder: genre + max_level filter form, live preview of matching respondents, save with name
- Audience Detail: genre insights table with delta visualization, generate concept/persona buttons
- Loading state: animated spinner + random loading verb from curated list, displayed as "{verb} {output type} for {audienceName}…". Verb text uses a shimmer/shine gradient animation (`shine-text` CSS class) implemented as a `background-clip: text` sweep. Loading verbs: Accomplishing, Building, Composing, Constructing, Concocting, Conjuring, Creating, Effecting, Executing, Fabricating, Fashioning, Forging, Forming, Generating, Manufacturing, Originating, Producing, Shaping, Materializing, Summoning.
- Saved Outputs: list view of all saved concepts and personas with thumbnail if card image exists, detail view with genre_signals_used traceability
- Regenerate button reruns full loop but does NOT auto-save; user must explicitly save
- Card Image: "Generate Card Image" button on output detail page, image displays inline once generated, button becomes "Regenerate Card Image". DALL-E prompt shown for traceability.

### Interest Scale Handling

The interest scale is inverted: 1 = highest interest, 5 = none. This affects:
- All sorts: ASC surfaces most interested first
- Bar chart width: `(6 - interest_level) / 5 * 100%`
- Delta formula: `population_avg - segment_avg` (positive = segment MORE interested)
- Every view showing interest scores must include a legend

### Schema Contracts

- `FilterDefinition`: `{ filters: [{ genre_slug: string, max_level: number }] }`
- A respondent matches if their interest_level <= max_level for ALL filters (AND logic)
- `GenreSignal`: `{ genre_name: string, genre_slug: string, avg_score: number }`
- Campaign concept output: title, concept, channel, rya_score (1-10), rya_rationale, genre_signals_used
- Persona output: persona_name, who_they_are, what_they_care_about[], what_does_not_resonate[], creative_direction, genre_signals_used

### Stack

- Next.js 15 App Router
- Supabase (local)
- OpenAI gpt-4o-mini via Vercel AI SDK
- Arize Phoenix (local, pip install)
- Tailwind CSS

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)
- `OPENAI_API_KEY`

## Testing Decisions

### What makes a good test

Tests should verify external behavior through the module's public interface, not implementation details. A test is good if it would still pass after an internal refactor that preserves the same inputs and outputs. Tests should use realistic fixture data (the known audience clusters) to catch real bugs.

### Modules under test

**Module 2 — Genre Signals Engine (unit tests)**
- `getGenreSignals`: given respondent IDs [1001, 1002, 1003] (Emerging Tech Professionals), verify How-To Content avg = 1.0, Coding/Robotics avg = 1.33
- `computeDeltas`: given known segment and population averages, verify delta values and directional labels
- `resolveAudience`: given filter `[{genre_slug: "RQ.2.78", max_level: 1}]`, verify only respondents 1001, 1002, 1003 match
- Edge cases: empty respondent set, single respondent, filter that matches nobody

**Module 4 — Eval Layer (unit tests)**
- `evalSchemaCompliance`: pass with valid output, fail with missing required field
- `evalGroundedness`: pass when narrative contains "Coding / Robotics", fail when narrative is generic with no genre citations
- `evalRYARange`: pass with score 6, fail with score 0 or 11, fail with empty rationale
- `runEvals`: verify correct eval selection per output_type (RYA range skipped for persona)

### Test fixtures

Use the 4 known audience clusters as fixture data. These provide deterministic expected values for genre aggregations and delta calculations.

## Out of Scope

- User authentication or multi-tenancy
- Demographic filtering (respondents.csv has no demographic data)
- Streaming LLM responses (all generation is synchronous)
- Production deployment (local Supabase only)
- Real-time collaboration
- Export/download of outputs
- Editing saved outputs after creation
- Audience deletion or modification after save
- Mobile-responsive design (desktop-first)
- Automated recomputation of respondent_ids when underlying data changes

## Further Notes

- The dataset is intentionally small (12 respondents, 10 genres) to keep the exercise focused on product and engineering decisions rather than scale
- The 4 audience clusters (Emerging Tech Professionals, Wellness-Oriented Parents, Competitive Sports Fans, Affluent Culture Seekers) must be discoverable through the segment builder, never hardcoded
- The RYA score (Radical Yet Acceptable) is the platform's core differentiating IP — the eval layer must enforce that every generated concept includes a score with a rationale that cites genre data
- The build gate in ai-layer.md requires manual error analysis of Phoenix traces before writing UI code — this is not optional
- `docs/mockups.md` is currently empty; UI design will follow minimal patterns sufficient to demonstrate the AI layer
