---
name: generate-prompts
description: This skill should be used when writing or modifying LLM prompt templates for /api/generate/concept and /api/generate/persona, including system prompts, generation prompts, refinement prompts, and genre_signals interpolation.
---

# Generate Prompts Skill

This skill provides the verbatim prompt templates for both API
generation routes. Load it when building or modifying the prompt
construction code in the API routes.

## Reference File

All prompt templates live in:
`references/prompt-templates.md`

Load that file before writing any prompt-related code.

## Key Rules

1. Prompts are used verbatim — do not paraphrase or shorten them
2. {{genre_signals}}, {{brand}}, {{brief}} are runtime placeholders
   replaced using the interpolation function in the reference file
3. All 10 genres are always included in genre_signals — never filter
4. Refinement prompts are selected based on which eval failed:
   - schema fail → Schema Failure refinement prompt
   - groundedness fail → Groundedness Failure refinement prompt
   - rya_range fail → RYA Range Failure refinement prompt
5. The system prompt is used on ALL attempts, both generation and
   refinement — it is never swapped out
6. Zod schemas in /lib/schemas.ts must exactly match the JSON schemas
   defined in the generation prompts — schema drift is the most
   common source of eval failures

## Process

1. Read references/prompt-templates.md
2. Use the verbatim template text when constructing prompts
3. Replace placeholders at runtime using the interpolation function
4. Do not modify prompt wording without updating both the template
   and the corresponding Zod schema in /lib/schemas.ts