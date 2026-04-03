# AI Layer

## Build Gate

**Do not write any UI code until all of the following are true:**

1. Both API routes return valid structured output
2. Phoenix is running and every LLM call produces a visible trace
3. All three evals pass binary (true/false) on at least 5 consecutive
   generations per route with no refinement loop triggered
4. A failed generation after max_attempts returns a structured 422,
   not a 500
5. Manual error analysis complete — see step below

**Manual error analysis (step 5 in detail):**
After the automated evals pass, open Phoenix at localhost:6006.
Manually review at least 10 generation traces. For each trace,
verify that the concept or persona NARRATIVE TEXT (not just
genre_signals_used) actually cites genre names. Look for traces
where the eval passed but the narrative feels generic. Document
one example of a clean passing trace in the README.

Per Husain and Shankar: error analysis is the most important
activity in evals. Automated evals tell you something failed.
Manual review tells you why and whether your evals are
challenging enough. If 100% of generations pass all evals on
the first attempt with no refinement, the evals may be too easy.

This is the primary deliverable. A working AI layer with a minimal
UI is a stronger submission than a polished UI with a stubbed or
unreliable AI layer.

---

## Route Structure

Two API routes. Next.js App Router. Standard async POST — no streaming.

```
POST /api/generate/concept
POST /api/generate/persona
```

Full request/response schemas are in rya_lite_plan.md Section B
under "LLM INTEGRATION LAYER".

Both routes execute a generate → evaluate → refine loop:

```
max_attempts = 3
attempt = 1

loop:
  1. Validate request body (attempt 1 only)
  2. Sanitize brief field (concept route only, attempt 1 only)
  3. Compute genre_signals from audience_id via Supabase query
  4. Construct prompt:
       attempt 1 → generation prompt
       attempt 2+ → targeted refinement prompt for the specific
                    eval that failed on the previous attempt
  5. Call LLM → generateObject() — no streaming
  6. Run eval layer on completed output
  7. If all evals pass:
       save to saved_outputs in Supabase
       return 200 with output JSON
       break
  8. If any eval fails and attempt < max_attempts:
       record which eval failed and why
       attempt++
       continue loop
  9. If any eval fails and attempt == max_attempts:
       log failed span to Phoenix
       return 422 eval_failed error
       break
```

The client receives either a 200 with the final output JSON or a
422 with the failure reason. There is no intermediate streaming.
The client displays a loading state for the full duration.

**Reference skills for implementation detail:**
- Prompt templates: /generate-prompts
- Eval implementations: /eval-layer
- Phoenix instrumentation: /phoenix-setup

---

## Security

The brief field is free-text user input injected into the LLM
prompt. Sanitize before prompt construction on attempt 1 only.

```typescript
function sanitizeBrief(brief: string): {
  sanitized: string
  wasSanitized: boolean
  matched: number
} {
  const trimmed = brief.trim().slice(0, 500)

  const patterns = [
    /ignore (all |previous |above )?instructions?/gi,
    /forget (everything|all|previous)/gi,
    /you are now/gi,
    /new (role|persona|identity|instructions?)/gi,
    /system prompt/gi,
    /\[INST\]/gi,
  ]

  let sanitized = trimmed
  let matched = 0
  for (const pattern of patterns) {
    if (pattern.test(sanitized)) matched++
    sanitized = sanitized.replace(pattern, '[removed]')
  }

  return { sanitized, wasSanitized: matched > 0, matched }
}
```

Log to Phoenix span:
```typescript
const { sanitized, wasSanitized, matched } = sanitizeBrief(brief)
span.setAttribute('security.brief_sanitized', wasSanitized)
span.setAttribute('security.patterns_matched', matched)
```

---

## Model Decision

Provider: OpenAI
Model: gpt-4o-mini
Env var: OPENAI_API_KEY

Rationale: gpt-4o-mini supports structured output (JSON mode)
required for schema enforcement. Cost is low enough for repeated
generate → eval → refine loops during development. Upgrade to
gpt-4o if output quality is insufficient after testing.

Use generateObject from Vercel AI SDK — not streamObject.
There is no streaming. The client waits for the full loop.

```typescript
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'

const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: conceptSchema,   // Zod schema — see /lib/schemas.ts
  system: SYSTEM_PROMPT,
  prompt: userPrompt,
})
```

Zod schemas live in /lib/schemas.ts and must exactly match the
JSON schemas defined in the prompt templates. Schema drift between
the Zod definition and the prompt template is the most common
source of eval failures during development.

---

## Regenerate Flow

The [Regenerate] button reruns the full generate → evaluate →
refine loop from attempt 1. Same audience, same brand, same brief.
LLM non-determinism provides variation.

The regenerated output replaces the current panel display but is
NOT automatically saved. The user must explicitly click
[Save to Concepts] after reviewing.

Do not delete or overwrite any previously saved output on regenerate.