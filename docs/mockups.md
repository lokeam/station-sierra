# UI Mockups

## How to use this file

Reference individual mockups by number when building a specific
view. Do not load this entire file into context unless building
multiple views in a single session.

Example: building the Audience Detail view → reference Mockup 6.
Building the generate flow → reference Mockups 10, 11, 12, 15.

---

## Component Index

```
1  — App Shell (all views)
2  — Respondents: table view
3  — Respondents: detail panel
4  — Audiences: empty state
5  — Audiences: populated card grid
6  — Audience: detail view with delta visualization
7  — New Audience: modal / segment builder
8  — Concepts: empty state
9  — Concepts: populated card grid
10 — Generate Panel: input state
11 — Generate Panel: loading state          ← REPLACES streaming
12 — Generate Panel: complete state
13 — Concept Card: detail view (full expanded)
14 — Persona Card: detail view (full expanded)
15 — Generate Panel: error state            ← NEW
```

---

## Design System

```
Light mode:  white bg, slate-900 text, slate-100 borders, blue-600 primary
Dark mode:   slate-900 bg, slate-100 text, slate-700 borders, blue-400 primary
Font:        Inter or system sans-serif
Radius:      8px cards, 4px inputs
Spacing:     8px base unit
Primary:     blue-600 (light) / blue-400 (dark)
RYA colors:  green 1-3 (safe), yellow 4-6 (moderate), orange/red 7-10 (radical)
All views share the App Shell (Mockup 1)
```

---

## MOCKUP 1 — App Shell (all views)

```
+------------------------------------------------------------------+
|  [≡] Station Sierra                              [●] Light/Dark  |
+------------------+-----------------------------------------------+
|                  |                                               |
|  NAVIGATION      |   MAIN CONTENT AREA                           |
|                  |   (changes per view)                          |
|  [👥] Respondents|                                               |
|                  |                                               |
|  [◉] Audiences   |                                               |
|                  |                                               |
|  [✦] Concepts    |                                               |
|                  |                                               |
|                  |                                               |
|                  |                                               |
|                  |                                               |
|                  |                                               |
|  ──────────────  |                                               |
|  12 respondents  |                                               |
|  10 genres       |                                               |
+------------------+-----------------------------------------------+
```

```
NOTES:
- Active nav item: blue-600 left border + blue text
- Nav footer: respondent count + genre count from DB
- Light/Dark toggle: sun/moon icon top-right
- [≡]: collapses nav on small viewports
- No user auth required
```

---

## MOCKUP 2 — Respondents: table view

```
+------------------+-----------------------------------------------+
|  NAVIGATION      |  Respondents                    [Filter ▼]   |
|  [👥] Respondents|  ─────────────────────────────────────────── |
|  [◉] Audiences   |  12 respondents · 10 genres                  |
|  [✦] Concepts    |                                               |
|                  |  ID      TOP INTERESTS              PROFILE   |
|                  |  ──────  ───────────────────────   ────────── |
|                  |  #1001   Coding · How-To · Docs    [View →]  |
|                  |  #1002   Coding · Documentary       [View →]  |
|                  |  #1003   Travel · How-To · Docs    [View →]  |
|                  |  #1004   Cooking · Meditation · Yoga [View →] |
|                  |  #1005   Meditation · Yoga · How-To [View →] |
|                  |  #1006   Cooking · Meditation · Wine [View →] |
|                  |  #1007   Fantasy Sports · Reality TV [View →] |
|                  |  #1008   Fantasy Sports · Cooking   [View →] |
|                  |  #1009   Fantasy Sports · Reality TV [View →] |
|                  |  #1010   Documentary · Wine · Travel [View →] |
|                  |  #1011   Documentary · Wine · Travel [View →] |
|                  |  #1012   Cooking · Documentary · Wine[View →] |
|                  |                                               |
|                  |  [+ New Audience from Selection]              |
+------------------+-----------------------------------------------+
```

```
NOTES:
- Top Interests: genres where interest_level <= 2 (inverted scale)
- Rows selectable via checkbox left of ID
- Selecting multiple rows activates [+ New Audience from Selection]
- [View →] opens Respondent Detail Panel (Mockup 3)
- [Filter ▼]: filter by genre + interest threshold
```

---

## MOCKUP 3 — Respondents: detail panel

```
+------------------+-----------------------------+------------------+
|  NAVIGATION      |  Respondents                |  Respondent 1001 |
|                  |  ───────────────────────    |  ─────────────── |
|                  |  #1001  Coding · How-To ... | [×] Close        |
|                  |  #1002  Coding · Documen... |                  |
|                  |  #1003  Travel · How-To ... | INTEREST PROFILE |
|                  |  ...                        |                  |
|                  |                             | Coding/Robotics  |
|                  |                             | ████████████  1  |
|                  |                             |                  |
|                  |                             | How-To Content   |
|                  |                             | ████████████  1  |
|                  |                             |                  |
|                  |                             | Documentary      |
|                  |                             | █████████     2  |
|                  |                             |                  |
|                  |                             | Travel & Tourism |
|                  |                             | █████████     2  |
|                  |                             |                  |
|                  |                             | Meditation       |
|                  |                             | ██████        3  |
|                  |                             |                  |
|                  |                             | Cooking/Baking   |
|                  |                             | ██████        3  |
|                  |                             |                  |
|                  |                             | Yoga / Pilates   |
|                  |                             | ██████        3  |
|                  |                             |                  |
|                  |                             | Wine             |
|                  |                             | ████          4  |
|                  |                             |                  |
|                  |                             | Fantasy Sports   |
|                  |                             | ██            5  |
|                  |                             |                  |
|                  |                             | Reality TV       |
|                  |                             | ██            5  |
|                  |                             |                  |
|                  |                             | Scale: 1=highest |
|                  |                             | interest, 5=none |
+------------------+-----------------------------+------------------+
```

```
NOTES:
- Bar length INVERTED: longer = higher interest (1 = longest)
  Formula: bar width = (6 - interest_level) / 5 * 100%
- Score number shown at right of bar
- Scale note at bottom — always visible, prevents confusion
- Panel slides in from right, does not replace main content
- Closing returns to full table view
```

---

## MOCKUP 4 — Audiences: empty state

```
+------------------+-----------------------------------------------+
|  NAVIGATION      |  Audiences                  [+ New Audience]  |
|  [👥] Respondents|  ─────────────────────────────────────────── |
|  [◉] Audiences   |                                               |
|  [✦] Concepts    |                                               |
|                  |          ◉                                    |
|                  |                                               |
|                  |    No audiences yet.                          |
|                  |                                               |
|                  |    Build a segment from respondent            |
|                  |    data to get started.                       |
|                  |                                               |
|                  |    [+ Create Your First Audience]             |
|                  |                                               |
+------------------+-----------------------------------------------+
```

---

## MOCKUP 5 — Audiences: populated card grid

```
+------------------+-----------------------------------------------+
|  NAVIGATION      |  Audiences                  [+ New Audience]  |
|  [👥] Respondents|  ─────────────────────────────────────────── |
|  [◉] Audiences   |  4 saved audiences                           |
|  [✦] Concepts    |                                               |
|                  |  +─────────────────+  +─────────────────+    |
|                  |  │ Emerging Tech   │  │ Wellness Parents │    |
|                  |  │ Professionals   │  │                  │    |
|                  |  │                 │  │ 3 respondents    │    |
|                  |  │ 3 respondents   │  │                  │    |
|                  |  │                 │  │ TOP GENRES       │    |
|                  |  │ TOP GENRES      │  │ ● Cooking   1.3  │    |
|                  |  │ ● How-To    1.0 │  │ ● Meditation1.0  │    |
|                  |  │ ● Coding    1.3 │  │ ● Yoga      1.0  │    |
|                  |  │ ● Travel    1.7 │  │ ● Travel    2.0  │    |
|                  |  │                 │  │                  │    |
|                  |  │ [Explore] [✦]   │  │ [Explore] [✦]    │    |
|                  |  +─────────────────+  +─────────────────+    |
|                  |                                               |
|                  |  +─────────────────+  +─────────────────+    |
|                  |  │ Competitive     │  │ Affluent Culture │    |
|                  |  │ Sports Fans     │  │ Seekers          │    |
|                  |  │                 │  │                  │    |
|                  |  │ 3 respondents   │  │ 3 respondents    │    |
|                  |  │                 │  │                  │    |
|                  |  │ TOP GENRES      │  │ TOP GENRES       │    |
|                  |  │ ● Fantasy   1.0 │  │ ● Documentary1.0 │    |
|                  |  │ ● Reality   1.7 │  │ ● Wine       1.0 │    |
|                  |  │                 │  │ ● Travel     1.0 │    |
|                  |  │                 │  │                  │    |
|                  |  │ [Explore] [✦]   │  │ [Explore] [✦]    │    |
|                  |  +─────────────────+  +─────────────────+    |
|                  |                                               |
+------------------+-----------------------------------------------+
```

```
NOTES:
- Genre scores are actual computed averages from data-model.md
  (corrected from previous version — see data-model audit)
- [Explore] opens Audience Detail view (Mockup 6)
- [✦] opens Generate panel with this audience pre-selected
- Score shown is avg interest_level (lower = more interested)
- Cards: 2-column grid desktop, 1-column mobile
```

---

## MOCKUP 6 — Audience: detail view with delta visualization

```
+------------------+-----------------------------------------------+
|  NAVIGATION      |  ← Audiences  /  Emerging Tech Professionals  |
|  [👥] Respondents|  ─────────────────────────────────────────── |
|  [◉] Audiences   |  3 respondents · Saved Mar 2026              |
|  [✦] Concepts    |                          [Generate Persona]   |
|                  |                          [Generate Concepts ✦] |
|                  |                                               |
|                  |  GENRE INTERESTS         vs. ALL RESPONDENTS  |
|                  |  ─────────────────────────────────────────── |
|                  |                                               |
|                  |  How-To Content                               |
|                  |  THIS:  ████████████████████  avg 1.0        |
|                  |  ALL:   ████████████████      avg 2.3  ▲+1.3 |
|                  |                                               |
|                  |  Coding / Robotics                            |
|                  |  THIS:  ██████████████████    avg 1.3        |
|                  |  ALL:   ███████████           avg 3.3  ▲+2.0 |
|                  |                                               |
|                  |  Documentary                                  |
|                  |  THIS:  ████████████████      avg 1.7        |
|                  |  ALL:   ████████████████      avg 2.1  ▲+0.4 |
|                  |                                               |
|                  |  Travel & Tourism                             |
|                  |  THIS:  ████████████████      avg 1.7        |
|                  |  ALL:   █████████████████     avg 1.8  ▲+0.1 |
|                  |                                               |
|                  |  Meditation                                   |
|                  |  THIS:  ██████████            avg 3.3        |
|                  |  ALL:   ████████████          avg 2.8  ▼-0.5 |
|                  |                                               |
|                  |  [ ... remaining genres collapsed ... ]       |
|                  |  [Show all genres ▼]                          |
|                  |                                               |
|                  |  CATEGORY BREAKDOWN                           |
|                  |  ─────────────────────────────────────────── |
|                  |  Continuing Ed    ██████████████████  HIGH   |
|                  |  Entertainment    ████████████        MED    |
|                  |  Travel           ██████████          MED    |
|                  |  Food & Drink     ████                LOW    |
|                  |  Personal Care    ████                LOW    |
|                  |  Sports/Gaming    ██                  NONE   |
|                  |                                               |
|                  |  SEGMENT DEFINITION                           |
|                  |  ─────────────────────────────────────────── |
|                  |  Respondents: #1001, #1002, #1003            |
|                  |  Filter: interest_level <= 2 on              |
|                  |  How-To Content + Coding/Robotics             |
|                  |                               [Edit] [Delete] |
|                  |                                               |
|                  |  SAVED OUTPUTS FOR THIS AUDIENCE             |
|                  |  ─────────────────────────────────────────── |
|                  |  [No saved concepts yet — Generate above ↑]  |
+------------------+-----------------------------------------------+
```

```
NOTES:
- Genres sorted by THIS avg ascending (most interested first)
- ▲ = segment MORE interested than all-respondents avg
- ▼ = segment LESS interested than all-respondents avg
- Delta formula: all_avg - segment_avg (positive = more interested)
- Delta > 0.5: highlight blue (significant signal)
- Category breakdown: aggregates by genre_categories pipe-delimited field
- HIGH: avg <= 2.0 | MED: 2.0-3.5 | NONE: avg > 3.5
- Genre scores use corrected cluster averages from data-model.md
- Saved Outputs section populates after first generation
```

---

## MOCKUP 7 — New Audience: modal / segment builder

```
+──────────────────────────────────────────────────────────────+
│  New Audience                                           [×]  │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  Audience Name                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ e.g. Wellness-Oriented Parents                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  BUILD BY                                                    │
│  ( ● ) Interest Filter    (   ) Manual Selection            │
│                                                              │
│  ── INTEREST FILTER ─────────────────────────────────────── │
│                                                              │
│  Show respondents who are interested in:                     │
│                                                              │
│  Genre                        Min Interest Level             │
│  ┌──────────────────────┐     ┌──────────────────┐          │
│  │ Select genre...   ▼  │     │ Interested (≤2) ▼│          │
│  └──────────────────────┘     └──────────────────┘          │
│                                              [+ Add Filter]  │
│                                                              │
│  Active filters:                                             │
│  ● Cooking / Baking / Grilling  ≤ 2    [×]                  │
│  ● Meditation                   ≤ 2    [×]                  │
│                                                              │
│  ── MATCHING RESPONDENTS ────────────────────────────────── │
│                                                              │
│  3 respondents match these filters                           │
│                                                              │
│  ✓ #1004  Cooking · Meditation · Yoga                        │
│  ✓ #1005  Meditation · Yoga · How-To                         │
│  ✓ #1006  Cooking · Meditation · Wine                        │
│                                                              │
│                                                              │
│                              [Cancel]  [Save Audience →]    │
+──────────────────────────────────────────────────────────────+
```

```
NOTES:
- Respondent matches update in real-time as filters change
- Interest level options: Highest (=1), Interested (<=2),
  Neutral or above (<=3), Any interest (<=4)
- Manual Selection mode: checkbox list of all 12 respondents
- Segment stored in Supabase as JSON filter rules (not ID arrays)
  {"filters": [{"genre_slug": "RQ.2.38", "max_level": 2},
               {"genre_slug": "RQ.2.97", "max_level": 2}]}
- [Save Audience →] disabled until name entered + >=1 match
```

---

## MOCKUP 8 — Concepts: empty state

```
+------------------+-----------------------------------------------+
|  NAVIGATION      |  Concepts                   [+ Generate ✦]   |
|  [👥] Respondents|  ─────────────────────────────────────────── |
|  [◉] Audiences   |                                               |
|  [✦] Concepts    |                                               |
|                  |          ✦                                    |
|                  |                                               |
|                  |    No concepts yet.                           |
|                  |                                               |
|                  |    Select an audience and enter a brief       |
|                  |    to generate your first concept.            |
|                  |                                               |
|                  |    [+ Generate First Concept]                 |
|                  |                                               |
+------------------+-----------------------------------------------+
```

---

## MOCKUP 9 — Concepts: populated card grid

```
+------------------+-----------------------------------------------+
|  NAVIGATION      |  Concepts                   [+ Generate ✦]   |
|  [👥] Respondents|  ─────────────────────────────────────────── |
|  [◉] Audiences   |  6 saved concepts                [Filter ▼]  |
|  [✦] Concepts    |                                               |
|                  |  +────────────────────+ +───────────────────+ |
|                  |  │ TYPE: CAMPAIGN     │ │ TYPE: PERSONA     │ |
|                  |  │                   │ │                   │ |
|                  |  │ Trail & Discovery  │ │ Emerging Tech     │ |
|                  |  │                   │ │ Professional       │ |
|                  |  │ Audience:         │ │                   │ |
|                  |  │ Emerging Tech     │ │ Audience:         │ |
|                  |  │ Professionals     │ │ Emerging Tech     │ |
|                  |  │                   │ │ Professionals     │ |
|                  |  │ "A documentary-   │ │                   │ |
|                  |  │ style campaign    │ │ "Practical, self- │ |
|                  |  │ following real    │ │ directed learners  │ |
|                  |  │ engineers on..."  │ │ who see travel..." │ |
|                  |  │                   │ │                   │ |
|                  |  │ RYA  [████░░] 6  │ │ Saved 2h ago      │ |
|                  |  │ Channel: YouTube  │ │                   │ |
|                  |  │                   │ │ [View →]  [🗑]    │ |
|                  |  │ [View →]  [🗑]    │ │                   │ |
|                  |  +────────────────────+ +───────────────────+ |
|                  |                                               |
|                  |  +────────────────────+ +───────────────────+ |
|                  |  │ TYPE: CAMPAIGN     │ │ TYPE: CAMPAIGN    │ |
|                  |  │                   │ │                   │ |
|                  |  │ The Home Chef     │ │ Mindful Weekend   │ |
|                  |  │ Revolution        │ │                   │ |
|                  |  │                   │ │ ...               │ |
|                  |  │ Audience:         │ │                   │ |
|                  |  │ Wellness Parents  │ │ RYA  [██░░░░] 3   │ |
|                  |  │                   │ │                   │ |
|                  |  │ RYA  [███████] 8  │ │ [View →]  [🗑]    │ |
|                  |  │                   │ │                   │ |
|                  |  │ [View →]  [🗑]    │ │                   │ |
|                  |  +────────────────────+ +───────────────────+ |
|                  |                                               |
+------------------+-----------------------------------------------+
```

```
NOTES:
- RYA bar: green 1-3, yellow 4-6, orange/red 7-10
- Campaign cards: title, audience, excerpt, RYA bar+score, channel
- Persona cards: name, audience, excerpt, timestamp
- [Filter ▼]: filter by type (Campaign/Persona), audience, RYA range
- [🗑]: delete with confirm dialog
- 2-column grid desktop
```

---

## MOCKUP 10 — Generate Panel: input state

```
+------------------+---------------------------+------------------+
|  NAVIGATION      |  Concepts                 │  Generate ✦      |
|                  |  ─────────────────────    │  ─────────────── |
|                  |  [card grid...]           │ [×] Close        |
|                  |                           │                  |
|                  |                           │ AUDIENCE         |
|                  |                           │ ┌─────────────┐  |
|                  |                           │ │ Select... ▼ │  |
|                  |                           │ └─────────────┘  |
|                  |                           │                  |
|                  |                           │ TYPE             |
|                  |                           │ [Campaign ●]     |
|                  |                           │ [Persona  ○]     |
|                  |                           │                  |
|                  |                           │ ── IF CAMPAIGN── |
|                  |                           │ Brand / Product  |
|                  |                           │ ┌─────────────┐  |
|                  |                           │ │ e.g. PepsiCo│  |
|                  |                           │ │ new hydrat- │  |
|                  |                           │ │ ion drink   │  |
|                  |                           │ └─────────────┘  |
|                  |                           │                  |
|                  |                           │ Brief (optional) |
|                  |                           │ ┌─────────────┐  |
|                  |                           │ │ Any specific│  |
|                  |                           │ │ direction   │  |
|                  |                           │ │ or tone...  │  |
|                  |                           │ └─────────────┘  |
|                  |                           │                  |
|                  |                           │ ── SIGNAL ────── |
|                  |                           │ Emerging Tech    |
|                  |                           │ Professionals    |
|                  |                           │ Top: How-To (1)  |
|                  |                           │ Coding (1.3)     |
|                  |                           │ Travel (1.7)     |
|                  |                           │                  |
|                  |                           │ [Generate ✦]     |
+------------------+---------------------------+------------------+
```

```
NOTES:
- Audience dropdown shows all saved audiences with respondent count
- Selecting audience shows SIGNAL preview immediately (no submit)
- SIGNAL shows top 3 genres by avg score (ascending sort)
- Persona type: Brand + Brief fields hidden
- [Generate ✦] disabled until Audience selected
- On click: transitions to Mockup 11 (loading state)
- Brief field is sanitized server-side before prompt injection
```

---

## MOCKUP 11 — Generate Panel: loading state

```
+------------------+---------------------------+------------------+
|  NAVIGATION      |  Concepts                 │  Generating ✦    |
|                  |  ─────────────────────    │  ─────────────── |
|                  |  [card grid...]           │                  |
|                  |                           │ Emerging Tech    |
|                  |                           │ Professionals    |
|                  |                           │ PepsiCo hydration|
|                  |                           │                  |
|                  |                           │ ──────────────── |
|                  |                           │                  |
|                  |                           │   ⠿              |
|                  |                           │                  |
|                  |                           │  Analyzing your  |
|                  |                           │  audience...     |
|                  |                           │                  |
|                  |                           │ ──────────────── |
|                  |                           │                  |
|                  |                           │ (phrases rotate  |
|                  |                           │  every 2.5s with |
|                  |                           │  CSS fade)       |
|                  |                           │                  |
+------------------+---------------------------+------------------+
```

```
NOTES:
- There is NO streaming. The generate→evaluate→refine loop runs
  server-side and returns only when complete or failed.
- The loading state covers the full duration (typically 3-15s)
- Spinner: CSS animation (Tailwind animate-spin or similar)
- Phrases rotate every 2.5 seconds with opacity fade transition
- Random start index so repeated generations feel different

PHASE 1 PHRASES (display from request start):
  "Analyzing your audience..."
  "Mapping genre affinities..."
  "Finding the signal..."
  "Calibrating creative risk..."
  "Grounding the concept..."
  "Stress-testing the brief..."
  "Noodling on angles..."
  "Scoring for radical-yet-acceptable..."
  "Finding the white space..."
  "Cross-referencing the data..."

PHASE 2 PHRASES (optional, display after 8s if not yet resolved):
  "Refining the output..."
  "Tightening the signal..."
  "Cross-checking the data..."
  "Strengthening the grounding..."
  "Recalibrating..."

- No cancel button. Loop runs to completion.
- On success: transitions to Mockup 12 (complete state)
- On failure after max_attempts: transitions to Mockup 15 (error)
```

---

## MOCKUP 12 — Generate Panel: complete state

```
+------------------+---------------------------+------------------+
|  NAVIGATION      |  Concepts                 │  Generated ✦     |
|                  |  ─────────────────────    │  ─────────────── |
|                  |  [card grid...]           │ [×] Close        |
|                  |                           │                  |
|                  |                           │ Trail & Discovery |
|                  |                           │                  |
|                  |                           │ A documentary-   |
|                  |                           │ style campaign   |
|                  |                           │ following real   |
|                  |                           │ engineers on     |
|                  |                           │ outdoor travel   |
|                  |                           │ adventures...    |
|                  |                           │                  |
|                  |                           │ CHANNEL          |
|                  |                           │ YouTube / Podcast |
|                  |                           │                  |
|                  |                           │ RYA SCORE        |
|                  |                           │ [██████░░░░] 6   |
|                  |                           │ MODERATE RISK    |
|                  |                           │                  |
|                  |                           │ "Unconventional  |
|                  |                           │ for a beverage   |
|                  |                           │ brand but aligns |
|                  |                           │ with documented  |
|                  |                           │ Travel (1.7) and |
|                  |                           │ Documentary (1.7)|
|                  |                           │ interest."       |
|                  |                           │                  |
|                  |                           │ GROUNDED IN      |
|                  |                           │ ● How-To    1.0  |
|                  |                           │ ● Coding    1.3  |
|                  |                           │ ● Travel    1.7  |
|                  |                           │                  |
|                  |                           │ [Save to Concepts]|
|                  |                           │ [Regenerate ↺]   |
+------------------+---------------------------+------------------+
```

```
NOTES:
- RYA bar: green 1-3, yellow 4-6, orange/red 7-10
- Risk label: SAFE (1-3), MODERATE (4-6), RADICAL (7-10)
- GROUNDED IN: the genre_signals_used from the LLM response
  These are genres cited in the narrative text, not all genres
- [Save to Concepts]: writes to saved_outputs in Supabase,
  adds card to grid, closes panel
- [Regenerate ↺]: reruns the full loop from attempt 1,
  same inputs, does NOT auto-save, does NOT overwrite saved outputs
- [×] Close: discards without saving
```

---

## MOCKUP 13 — Concept Card: detail view (full expanded)

```
+------------------+-----------------------------------------------+
|  NAVIGATION      |  <- Concepts  /  Trail & Discovery             |
|  [👥] Respondents|  ─────────────────────────────────────────── |
|  [◉] Audiences   |  Campaign Concept · Emerging Tech Professionals|
|  [✦] Concepts    |  Generated Mar 27, 2026          [🗑 Delete]  |
|                  |                                               |
|                  |  CONCEPT                                      |
|                  |  ─────────────────────────────────────────── |
|                  |  Trail & Discovery                            |
|                  |                                               |
|                  |  A documentary-style campaign following real  |
|                  |  engineers and technologists on outdoor travel|
|                  |  adventures, showcasing how they stay hydrated|
|                  |  and energized while exploring. The campaign  |
|                  |  grounds the product in this audience's       |
|                  |  documented interest in both learning content |
|                  |  (Coding/Robotics: 1.3) and travel experiences|
|                  |  (Travel & Tourism: 1.7), suggesting an       |
|                  |  aspirational, discovery-oriented framing     |
|                  |  rather than a performance or health claim.   |
|                  |                                               |
|                  |  CHANNEL RECOMMENDATION                       |
|                  |  YouTube long-form / Podcast                  |
|                  |                                               |
|                  |  RYA SCORE                                    |
|                  |  ─────────────────────────────────────────── |
|                  |  [██████░░░░]  6 / 10  MODERATE RISK         |
|                  |                                               |
|                  |  "Unconventional for a beverage brand but     |
|                  |  well-supported by this audience's documented |
|                  |  affinity for Travel content (1.7) and        |
|                  |  Documentary formats (1.7), indicating        |
|                  |  openness to long-form storytelling."         |
|                  |                                               |
|                  |  AUDIENCE SIGNAL USED                         |
|                  |  ─────────────────────────────────────────── |
|                  |  ● How-To Content         avg 1.0  (HIGH)    |
|                  |  ● Coding / Robotics      avg 1.3  (HIGH)    |
|                  |  ● Documentary            avg 1.7  (HIGH)    |
|                  |  ● Travel & Tourism       avg 1.7  (HIGH)    |
|                  |                                               |
|                  |  BRIEF USED                                   |
|                  |  ─────────────────────────────────────────── |
|                  |  Brand: PepsiCo -- new hydration drink         |
|                  |  Brief: Focus on active, curious lifestyle    |
|                  |                                               |
+------------------+-----------------------------------------------+
```

```
NOTES:
- AUDIENCE SIGNAL USED = genre_signals_used from saved_outputs.content
- Scores use corrected cluster averages from data-model.md
- HIGH/MED thresholds: avg <= 2.0 = HIGH, 2.0-3.5 = MED
- BRIEF USED only shown if brief was provided at generation time
```

---

## MOCKUP 14 — Persona Card: detail view (full expanded)

```
+------------------+-----------------------------------------------+
|  NAVIGATION      |  <- Concepts  /  Emerging Tech Professional    |
|  [👥] Respondents|  ─────────────────────────────────────────── |
|  [◉] Audiences   |  Audience Persona · Emerging Tech Professionals|
|  [✦] Concepts    |  Generated Mar 27, 2026          [🗑 Delete]  |
|                  |                                               |
|                  |  WHO THEY ARE                                 |
|                  |  ─────────────────────────────────────────── |
|                  |  Practical, self-directed learners who treat  |
|                  |  both technology and travel as extensions of  |
|                  |  their curiosity. They build things and go    |
|                  |  places with intent. Their media diet skews   |
|                  |  toward How-To Content (1.0) and Documentary  |
|                  |  (1.7) -- instructional and evidence-based,  |
|                  |  not entertainment-first.                     |
|                  |                                               |
|                  |  WHAT THEY CARE ABOUT                         |
|                  |  ─────────────────────────────────────────── |
|                  |  ● Learning with immediate application        |
|                  |    (How-To Content: 1.0, Coding/Robotics: 1.3)|
|                  |  ● Authentic exploration over curated travel  |
|                  |    (Travel & Tourism: 1.7)                    |
|                  |  ● Narratives grounded in real outcomes       |
|                  |    (Documentary: 1.7)                         |
|                  |                                               |
|                  |  WHAT DOES NOT RESONATE                       |
|                  |  ─────────────────────────────────────────── |
|                  |  ● Entertainment for its own sake             |
|                  |    (Reality TV: 5.0, Fantasy Sports: 5.0)    |
|                  |  ● Aspirational lifestyle without substance   |
|                  |                                               |
|                  |  CREATIVE DIRECTION                           |
|                  |  ─────────────────────────────────────────── |
|                  |  Lead with utility and discovery. This        |
|                  |  audience responds to creative that teaches   |
|                  |  something or shows somewhere new. Humor      |
|                  |  works if rooted in recognizable technical    |
|                  |  situations. Avoid vague aspiration.          |
|                  |                                               |
|                  |  BASED ON                                     |
|                  |  ─────────────────────────────────────────── |
|                  |  3 respondents (#1001, #1002, #1003)          |
|                  |  Segment: interest_level <= 2 on             |
|                  |  How-To Content + Coding/Robotics             |
|                  |                                               |
+------------------+-----------------------------------------------+
```

```
NOTES:
- All genre citations use corrected averages from data-model.md
- WHO THEY ARE must cite at least 2 genres (groundedness eval)
- BASED ON section sourced from audiences.filter_definition
```

---

## MOCKUP 15 — Generate Panel: error state

```
+------------------+---------------------------+------------------+
|  NAVIGATION      |  Concepts                 │  Generation      |
|                  |  ─────────────────────    │  Failed          |
|                  |  [card grid...]           │  ─────────────── |
|                  |                           │                  |
|                  |                           │ Emerging Tech    |
|                  |                           │ Professionals    |
|                  |                           │ PepsiCo hydration|
|                  |                           │                  |
|                  |                           │ ──────────────── |
|                  |                           │                  |
|                  |                           │  ✗               |
|                  |                           │                  |
|                  |                           │  Couldn't ground |
|                  |                           │  this one. Try   |
|                  |                           │  adjusting your  |
|                  |                           │  brief.          |
|                  |                           │                  |
|                  |                           │  [Try Again]     |
|                  |                           │                  |
|                  |                           │ ──────────────── |
|                  |                           │                  |
|                  |                           │ [← Back to form] |
|                  |                           │                  |
+------------------+---------------------------+------------------+
```

```
NOTES:
- Displayed when route returns HTTP 422 after max_attempts (3)
- Error message is ALWAYS generic -- never expose eval internals
- The eval failure detail (which eval failed, why) is in Phoenix
  traces only -- not surfaced to the user under any circumstance
- [Try Again]: reruns the exact same inputs from attempt 1
- [<- Back to form]: returns to Mockup 10 (input state) with
  form fields pre-populated from the previous attempt
- ✗ icon: red, same size as the ⠿ spinner in Mockup 11
```