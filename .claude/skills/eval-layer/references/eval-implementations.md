# Eval Implementations

All evals live in /lib/evals.ts.
All are binary. No scores. No partial credit.

---

## EvalResult Type

```typescript
type EvalResult = {
  pass: boolean
  detail: string       // human-readable, used in Phoenix logging
                       // and in refinement prompt interpolation
  cited?: string[]     // groundedness eval only
}
```

---

## Eval 1 — Schema Compliance

```typescript
function evalSchemaCompliance(
  output: unknown,
  outputType: 'campaign_concept' | 'persona'
): EvalResult {
  const errors: string[] = []

  if (outputType === 'campaign_concept') {
    const o = output as Record<string, unknown>
    if (!o.title || typeof o.title !== 'string')
      errors.push('title missing or not a string')
    if (!o.concept || typeof o.concept !== 'string')
      errors.push('concept missing or not a string')
    if (!o.channel || typeof o.channel !== 'string')
      errors.push('channel missing or not a string')
    if (!o.rya_rationale || typeof o.rya_rationale !== 'string')
      errors.push('rya_rationale missing')
    if (!Number.isInteger(o.rya_score) ||
        (o.rya_score as number) < 1 ||
        (o.rya_score as number) > 10)
      errors.push(`rya_score invalid: ${o.rya_score}`)
    if (!Array.isArray(o.genre_signals_used) ||
        o.genre_signals_used.length < 2)
      errors.push('genre_signals_used requires minimum 2 items')
  }

  if (outputType === 'persona') {
    const o = output as Record<string, unknown>
    if (!o.persona_name || typeof o.persona_name !== 'string')
      errors.push('persona_name missing')
    if (!o.who_they_are || typeof o.who_they_are !== 'string')
      errors.push('who_they_are missing')
    if (!Array.isArray(o.what_they_care_about) ||
        o.what_they_care_about.length < 2)
      errors.push('what_they_care_about requires minimum 2 items')
    if (!Array.isArray(o.what_does_not_resonate) ||
        o.what_does_not_resonate.length < 1)
      errors.push('what_does_not_resonate requires minimum 1 item')
    if (!o.creative_direction || typeof o.creative_direction !== 'string')
      errors.push('creative_direction missing')
    if (!Array.isArray(o.genre_signals_used) ||
        o.genre_signals_used.length < 2)
      errors.push('genre_signals_used requires minimum 2 items')
  }

  return {
    pass: errors.length === 0,
    detail: errors.length === 0 ? 'schema valid' : errors.join('; ')
  }
}
```

---

## Eval 2 — Groundedness

CRITICAL: Check NARRATIVE TEXT only. Do NOT use JSON.stringify on
the full output. genre_signals_used always contains genre names —
serializing the full object causes a false pass every time.

```typescript
function evalGroundedness(
  output: CampaignConcept | Persona,
  genreSignals: GenreSignal[]
): EvalResult {
  // Narrative text fields only — genre_signals_used excluded
  const narrativeText = [
    (output as CampaignConcept).title ?? '',
    (output as CampaignConcept).concept ?? '',
    (output as CampaignConcept).rya_rationale ?? '',
    (output as Persona).who_they_are ?? '',
    ...((output as Persona).what_they_care_about ?? []),
    ...((output as Persona).what_does_not_resonate ?? []),
    (output as Persona).creative_direction ?? '',
  ].join(' ').toLowerCase()

  const cited = genreSignals.filter(g =>
    narrativeText.includes(g.genre_name.toLowerCase())
  )

  return {
    pass: cited.length >= 2,
    detail: cited.length >= 2
      ? `${cited.length} genres cited in narrative text`
      : `only ${cited.length} genre(s) cited in narrative text -- ` +
        `minimum 2 required. Not found in narrative: ${genreSignals
          .filter(g => !cited.includes(g))
          .map(g => g.genre_name)
          .join(', ')}`,
    cited: cited.map(g => g.genre_name)
  }
}
```

The detail string on failure names specific missing genres.
This string is interpolated into the groundedness refinement prompt.

---

## Eval 3 — RYA Range (campaign_concept only)

```typescript
function evalRYARange(output: CampaignConcept): EvalResult {
  const score = output.rya_score
  const pass = Number.isInteger(score) && score >= 1 && score <= 10

  return {
    pass,
    detail: pass
      ? `rya_score ${score} is valid`
      : `rya_score ${score} is invalid -- must be a whole integer 1-10`
  }
}
```

Note: Number.isInteger(6.0) returns true in JavaScript because
6.0 === 6. Real failure modes are 6.5 (float), 0, and 11.

---

## Eval Runner

```typescript
function runEvals(
  output: CampaignConcept | Persona,
  outputType: 'campaign_concept' | 'persona',
  genreSignals: GenreSignal[]
): { pass: boolean; failedEval: string | null; detail: string } {

  const schema = evalSchemaCompliance(output, outputType)
  if (!schema.pass) {
    return { pass: false, failedEval: 'schema', detail: schema.detail }
  }

  const ground = evalGroundedness(output, genreSignals)
  if (!ground.pass) {
    return { pass: false, failedEval: 'groundedness', detail: ground.detail }
  }

  if (outputType === 'campaign_concept') {
    const rya = evalRYARange(output as CampaignConcept)
    if (!rya.pass) {
      return { pass: false, failedEval: 'rya_range', detail: rya.detail }
    }
  }

  return { pass: true, failedEval: null, detail: 'all evals passed' }
}
```

Execution order: schema → groundedness → RYA range.
Only first failure returned. All evals rerun from start on next attempt.
The failedEval string maps to which refinement prompt to select.

---

## On Eval Failure After max_attempts

Return HTTP 422:

```json
{
  "error": "generation_eval_failed",
  "eval": "groundedness",
  "detail": "only 0 genres cited after 3 attempts",
  "retryable": true
}
```

Log failed span to Phoenix with eval.failure_reason and
eval.attempts attributes.

---

## Required Unit Tests

Write these before marking the eval layer complete.
These are deterministic functions — no LLM calls required.

### Test 1: Groundedness FAIL
Narrative text has zero genre citations. Genre names only appear
in genre_signals_used (which must be ignored).

```typescript
const failingOutput = {
  title: "The Bold Campaign",
  concept: "A campaign that speaks to this unique audience.",
  rya_rationale: "This concept takes a creative risk.",
  rya_score: 6,
  channel: "YouTube",
  genre_signals_used: [
    { genre_name: "Coding / Robotics", avg_score: 1.0 },
    { genre_name: "How-To Content", avg_score: 1.0 }
  ]
}
// evalGroundedness(failingOutput, genreSignals).pass must be FALSE
```

### Test 2: Groundedness PASS
Narrative text explicitly names at least 2 genres.

```typescript
const passingOutput = {
  title: "Trail and Discovery",
  concept: "Built for audiences who index highest on Coding / Robotics" +
           " and How-To Content -- practical learners who want...",
  rya_rationale: "Moderate risk for a Coding / Robotics audience.",
  rya_score: 5,
  channel: "YouTube",
  genre_signals_used: [...]
}
// evalGroundedness(passingOutput, genreSignals).pass must be TRUE
```

### Test 3: RYA Range FAIL
```typescript
// evalRYARange({ ...output, rya_score: 11 }).pass must be FALSE
// evalRYARange({ ...output, rya_score: 6.5 }).pass must be FALSE
// evalRYARange({ ...output, rya_score: 0 }).pass must be FALSE
```

Per Husain: every fixed bug gets a test case. Test 1 above is the
regression guard for the groundedness false-pass bug caught in audit.