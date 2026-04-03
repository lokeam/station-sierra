# Required Span Attributes

One span per generation request. Covers the full loop including
all attempts. Set attributes as the loop progresses — do not
wait until the end to set token counts and latency.

## All Attributes

```
audience.id                    -- string UUID from request body
audience.name                  -- string from Supabase query
audience.respondent_count      -- integer from Supabase query
output.type                    -- 'campaign_concept' | 'persona'
llm.model                      -- 'gpt-4o-mini'
llm.attempts                   -- integer: total LLM calls made
llm.total_prompt_tokens        -- integer: sum across all attempts
llm.total_completion_tokens    -- integer: sum across all attempts
llm.total_latency_ms           -- integer: sum across all attempts
eval.final_pass                -- boolean
eval.failure_eval              -- 'schema' | 'groundedness' |
                                  'rya_range' | null
eval.failure_detail            -- string from failing eval | null
eval.attempts_before_pass      -- integer: 1 if first attempt passed
output.rya_score               -- integer | null (concept only)
output.genres_cited            -- string: comma-separated genre names
security.brief_sanitized       -- boolean (concept route only)
security.patterns_matched      -- integer (concept route only)
```

## Notes on Specific Attributes

**llm.attempts**: Increment after each generateObject() call.
If first attempt passes all evals, this is 1. If two refinement
attempts were needed, this is 3.

**eval.attempts_before_pass**: Same as llm.attempts if the final
attempt passed. Set to max_attempts (3) if all attempts failed.

**output.genres_cited**: The cited[] array from evalGroundedness,
joined with commas. Set only when eval passes. On failure after
max_attempts, set to empty string.

**eval.failure_eval**: Set to the failedEval string from runEvals
on the final failed attempt. null if all evals passed.

**security.brief_sanitized**: Set from the wasSanitized return
value of sanitizeBrief(). Only present on concept route spans.

## Accumulating Token Counts

```typescript
let totalPromptTokens = 0
let totalCompletionTokens = 0
let totalLatencyMs = 0

// Inside the loop, after each generateObject() call:
totalPromptTokens += usage.promptTokens
totalCompletionTokens += usage.completionTokens
totalLatencyMs += callLatencyMs

// After the loop:
span.setAttribute('llm.total_prompt_tokens', totalPromptTokens)
span.setAttribute('llm.total_completion_tokens', totalCompletionTokens)
span.setAttribute('llm.total_latency_ms', totalLatencyMs)
span.setAttribute('llm.attempts', attemptCount)
```