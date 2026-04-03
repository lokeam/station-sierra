---
name: eval-layer
description: This skill should be used when building or modifying the eval layer in /lib/evals.ts, including evalSchemaCompliance, evalGroundedness, evalRYARange, the runEvals runner, and unit tests for all three evals.
---

# Eval Layer Skill

This skill provides the complete implementation spec for the three
binary evals that gate every LLM output before it is saved.

## Reference File

All eval implementations live in:
`references/eval-implementations.md`

Load that file before writing any code in /lib/evals.ts.

## Key Rules

1. All evals are binary — pass: true or pass: false only
   No score field. No partial credit. Per Husain and Shankar.
2. Evals run in order: schema → groundedness → RYA range
   Schema runs first — malformed objects throw in later evals
3. Only the first failing eval is returned per loop attempt
4. The refinement prompt for the next attempt is selected based
   on which eval name is returned in failedEval
5. CRITICAL: evalGroundedness checks NARRATIVE TEXT only —
   never JSON.stringify the full output object. genre_signals_used
   always contains genre names and would cause a false pass.
6. Unit tests are required for all three evals before shipping

## Process

1. Read references/eval-implementations.md
2. Implement evalSchemaCompliance, evalGroundedness, evalRYARange
   exactly as specified — do not simplify or combine them
3. Implement runEvals using the exact execution order specified
4. Write the three required unit tests before marking complete
5. Run unit tests — all must pass before moving to Phoenix setup