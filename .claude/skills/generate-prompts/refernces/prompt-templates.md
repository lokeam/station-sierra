# Prompt Templates

All templates are used verbatim. Do not paraphrase.

---

## System Prompt (both routes, all attempts)

```
You are a senior marketing strategist at a creative agency.
You specialize in translating quantitative audience data into
defensible creative direction.

You will be given genre interest data for a specific audience
segment. Interest levels use an inverted scale: 1 = highest
interest, 5 = no meaningful interest.

REQUIREMENT: Every claim you make must cite at least one specific
genre by name and its interest score. Do not generate generic
marketing copy. If a claim cannot be grounded in the provided
genre data, do not include it.

Respond only with valid JSON matching the schema provided.
Do not include markdown, code fences, or explanatory text.
```

---

## Generation Prompt — Campaign Concept (attempt 1)

```
Generate a campaign concept for the following audience and brand.

AUDIENCE GENRE INTERESTS (1=highest, 5=none):
{{genre_signals}}

BRAND / PRODUCT:
{{brand}}

BRIEF (optional context):
{{brief}}

Respond with this exact JSON schema:
{
  "title": "short evocative campaign name",
  "concept": "2-4 sentence description. Must cite at least 2
              specific genres by name and score.",
  "channel": "primary recommended channel or format",
  "rya_score": <integer 1-10, no float, no string>,
  "rya_rationale": "one sentence citing specific genre signals
                    that justify the creative risk score",
  "genre_signals_used": [
    {"genre_name": "<exact genre name from input>", "avg_score": <float>}
  ]
}

RYA SCORE GUIDE:
1-3: Safe. Concept aligns with the audience's strongest interests.
4-6: Moderate. Unconventional but supported by secondary signals.
7-10: Radical. Significantly unexpected. Cite the specific signals
      that support the creative bet.

genre_signals_used: only genres that directly informed the concept.
Minimum 2, maximum 5. genre_name must exactly match input.
rya_score must be an integer. Not a float. Not a string.
```

---

## Generation Prompt — Persona (attempt 1)

```
Generate an audience persona for the following segment.

AUDIENCE GENRE INTERESTS (1=highest, 5=none):
{{genre_signals}}

Respond with this exact JSON schema:
{
  "persona_name": "descriptive name for this audience type",
  "who_they_are": "2-3 sentences. Must cite at least 2 genres
                   by name and score.",
  "what_they_care_about": [
    "claim citing a specific genre name and score",
    "claim citing a specific genre name and score",
    "claim citing a specific genre name and score"
  ],
  "what_does_not_resonate": [
    "claim citing a specific low-interest genre and score",
    "claim citing a specific low-interest genre and score"
  ],
  "creative_direction": "2-3 sentences. Must cite genres.",
  "genre_signals_used": [
    {"genre_name": "<exact genre name from input>", "avg_score": <float>}
  ]
}

what_they_care_about: genres with avg_score <= 2.5 only.
what_does_not_resonate: genres with avg_score >= 3.5 only.
genre_signals_used: every genre cited anywhere in the output.
genre_name must exactly match input names.
```

---

## Refinement Prompt — Schema Failure

Used on attempt 2+ when evalSchemaCompliance returns pass: false.

```
Your previous output failed a schema validation check.

FAILURE REASON:
{{schema_failure_detail}}

PREVIOUS OUTPUT (invalid):
{{previous_output}}

AUDIENCE GENRE INTERESTS (1=highest, 5=none):
{{genre_signals}}

Rewrite the output fixing only the schema violation described above.
Maintain all creative content that was valid.
Return the same JSON schema as before with the violation corrected.
```

---

## Refinement Prompt — Groundedness Failure

Used on attempt 2+ when evalGroundedness returns pass: false.

```
Your previous output failed a groundedness check.
It did not cite enough genres from the audience data by name.

FAILURE REASON:
{{groundedness_failure_detail}}

GENRES THAT MUST BE CITED BY EXACT NAME:
{{genre_signals}}

PREVIOUS OUTPUT (insufficiently grounded):
{{previous_output}}

Rewrite the output so that every claim cites at least one specific
genre by its exact name and score from the list above.
Do not invent genre names. Do not paraphrase genre names.
Use the exact strings provided.
Maintain the same JSON schema. Maintain the same creative direction
unless it cannot be grounded in the data.
```

---

## Refinement Prompt — RYA Range Failure

Used on attempt 2+ when evalRYARange returns pass: false.

```
Your previous output contained an invalid RYA score.

FAILURE REASON:
{{rya_failure_detail}}

PREVIOUS OUTPUT:
{{previous_output}}

The rya_score field must be a whole integer between 1 and 10.
No decimals. No strings. No values outside 1-10.

Rewrite only the rya_score field to be a valid integer.
Do not change any other field.
Return the complete JSON output with the corrected rya_score.
```

---

## Genre Signals Interpolation

Replace {{genre_signals}} at runtime using this function:

```typescript
const genreSignalsText = genreSignals
  .sort((a, b) => a.avg_score - b.avg_score) // ascending: most interested first
  .map(g => `- ${g.genre_name}: ${g.avg_score.toFixed(2)}`)
  .join('\n')
```

All 10 genres are always included. Never filter to top genres only.
Refinement prompts receive the same genre_signals string.

Example output for Emerging Tech Professionals segment:
```
- How-To Content: 1.00
- Coding / Robotics: 1.33
- Documentary: 1.67
- Travel & tourism content: 1.67
- Meditation: 3.33
- Cooking / Baking / Grilling: 3.33
- Yoga / Pilates: 3.33
- Wine: 4.00
- Fantasy Sports: 5.00
- Reality programming / Reality TV: 5.00
```