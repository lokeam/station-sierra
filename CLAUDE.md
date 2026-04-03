# Station Sierra

Next.js 15 + Supabase + OpenAI take-home project.

## Build Order — Do Not Deviate

1. Database schema and seed data
2. AI generation routes with schema enforcement and eval layer
3. Arize Phoenix instrumentation on all LLM calls
4. Minimum UI to demonstrate the AI layer working
5. Full UI per mockups only if time remains

The AI reliability layer is the primary deliverable.
A polished UI with a shallow AI layer is a failed submission.

## Key References

- Product requirements: @docs/PRD.md
- Implementation plan: @plans/station_sierra_plan.md
- UI mockups: @docs/mockups.md
- AI route spec: @docs/ai-layer.md
- Data model: @docs/data-model.md

## Skills

- Prompt templates: /generate-prompts
- Eval implementations: /eval-layer
- Phoenix setup: /phoenix-setup

## Stack

- Next.js 15 App Router
- Supabase (local)
- OpenAI gpt-4o-mini
- Vercel AI SDK
- Arize Phoenix (local, pip)
- Tailwind CSS, light + dark mode

## Non-negotiables

- Every LLM call is traced in Phoenix
- Every LLM output is schema-validated before saving
- Every generated output cites at least one genre data point
- Interest scale is inverted: 1 = highest interest, 5 = none