# Station Sierra

Next.js 15 + Supabase for audience-grounded AI campaign generation.

## Prerequisites

- Node.js 20+
- Docker (for Supabase)
- Python 3.10+ (for Phoenix)
- Supabase CLI
- OpenAI API key

## Setup

```bash
# First-time bootstrap (installs deps, creates venv, starts Supabase, populates .env.local)
make setup

# Start everything (Phoenix background + Next.js foreground)
make dev
```

Run `make help` to see all available targets.

### Phoenix Modes

**Background (via `make dev`):** Phoenix logs to `.phoenix.log`. Tail with `make logs` in a separate terminal.

**Foreground (for debugging):** Run `make phoenix` in its own terminal for direct output. Start Next.js separately with `npm run dev`.

### Teardown

```bash
make stop    # Stops Phoenix and Supabase
```

<details>
<summary>Manual setup (without Make)</summary>

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.local.example .env.local
# Fill in OPENAI_API_KEY

# 3. Start Supabase (applies migrations + seed data)
npx supabase start

# 4. Start Phoenix (LLM observability)
python3 -m venv .venv
.venv/bin/pip install arize-phoenix
.venv/bin/python -m phoenix.server.main serve &

# 5. Start dev server
npm run dev
```

</details>

## API Routes

- `POST /api/generate/concept` — campaign concept generation (accepts `audience_id`, optional `brand_name`, `brief`)
- `POST /api/generate/persona` — audience persona generation (accepts `audience_id` only)

Both routes execute a generate → evaluate → refine loop (max 3 attempts).

## Observability

Phoenix UI: [http://localhost:6006](http://localhost:6006)

Every LLM call produces a span with attributes:
- `audience.id`, `audience.name`, `audience.respondent_count`
- `output.type` (campaign_concept | persona)
- `llm.model`, `llm.attempts`, `llm.total_prompt_tokens`, `llm.total_completion_tokens`
- `eval.final_pass`, `eval.failure_eval`, `eval.failure_detail`
- `output.genres_cited`, `output.rya_score` (concept only)
- `security.brief_sanitized`, `security.patterns_matched` (concept only)

## Testing

```bash
make test        # Unit tests (evals + genre signals)
make test-gen    # Build gate verification (checks service health first)
```

## Build Gate Verification (Phase 7)

Verified 2026-04-03. All criteria met.

### 7a: Automated Verification

| Check | Result |
|---|---|
| 5 consecutive concept generations pass all evals | 5/5 PASS, all first attempt |
| 5 consecutive persona generations pass all evals | 5/5 PASS, all first attempt |
| 404 on non-existent audience_id | PASS (returns 404, not 500) |
| Unit tests (44 tests across evals + genre-signals) | 44/44 PASS |

### 7b: Manual Trace Review

Reviewed 10 generation traces in Phoenix (5 concept, 5 persona).

**Concept traces (Emerging Tech Professionals):**
- All 5 cite "How-To Content" and "Coding / Robotics" by name in narrative text
- 2 of 5 also cite "Documentary" in the narrative
- RYA scores range 7-8, all with rationales citing specific genre scores
- Brief sanitization recorded: `brief_sanitized=false`, `patterns_matched=0`
- Average latency: ~9,000ms per generation

**Persona traces (Wellness-Oriented Parents):**
- All 5 cite "Meditation" and "Yoga / Pilates" by name in narrative
- 3 of 5 also cite "Cooking / Baking / Grilling" in what_they_care_about
- Average latency: ~6,000ms per generation

**Eval difficulty assessment:**
100% of generations passed all evals on the first attempt with no refinement
loop triggered. This is flagged per ai-layer.md guidance. The groundedness
eval requires only 2 genre citations, which gpt-4o-mini reliably produces
given the strong prompt. The evals are not too easy — they enforce real
structural and grounding constraints — but the model is consistently
compliant with well-structured prompts. If eval difficulty needs increasing,
raising the minimum citation count from 2 to 3 or requiring delta-aware
language would add challenge.

### Clean Passing Trace

**Span:** `generate.concept` (OK, 9239ms)
**Audience:** Emerging Tech Professionals (3 respondents)
**Model:** gpt-4o-mini | 739 prompt tokens | 403 completion tokens | 1 attempt

```json
{
  "title": "Unlock the Code: A Journey into Emerging Tech",
  "channel": "Social Media (YouTube for tutorials and Instagram for docuseries)",
  "concept": "The \"Unlock the Code\" campaign by TechCo aims to engage Emerging Tech Professionals by merging their passion for practical knowledge with their intrigue in tech innovation. Centered around How-To Content, the campaign will feature a series of interactive tutorials and webinars that cover the latest trends and applications in the industry. This approach aligns seamlessly with the audience's top interests, offering them direct access to expertise in Coding / Robotics. By showcasing real-world applications of tech tools, the campaign empowers emerging tech professionals to not only learn but also to create and innovate using the new developer tool. In addition to hands-on tutorials, our campaign will include a captivating mini-documentary series that explores the journeys of successful tech professionals navigating the world of robotics and coding. This Documentary content will provide inspiration and real-life narratives that resonate with the audience.",
  "rya_score": 7,
  "rya_rationale": "The campaign's RYA score of 7 reflects its innovative approach to inviting Emerging Tech Professionals into an interactive learning ecosystem while leveraging their top interests. The inclusion of How-To Content and Coding / Robotics addresses their strong enthusiasm for hands-on learning and practical applications, scoring 1.00 and 1.33 respectively.",
  "genre_signals_used": [
    { "genre_name": "How-To Content", "avg_score": 1.0 },
    { "genre_name": "Coding / Robotics", "avg_score": 1.33 }
  ]
}
```

**Genre citations in narrative:** How-To Content, Coding / Robotics, Documentary
**Eval results:** schema_compliance=PASS, groundedness=PASS (3 genres cited), rya_range=PASS (score 7, rationale present)
