# Data Model

## Source Files

Three CSV files are provided in `/data`. All three must be seeded
into Supabase via `seed.sql` before the app is usable.

---

## CSV: respondents.csv

**Status: Empty in the provided dataset.**
The file exists but contains no data rows. No demographic columns
are present. The respondent record is identity-only.

**Decision:** Store respondent_id as the sole column. Document this
assumption in the README. Do not attempt to infer or fabricate
demographic attributes. The segment builder operates on genre
interest data alone.

```sql
CREATE TABLE respondents (
  respondent_id INTEGER PRIMARY KEY
);
```

Seed: insert respondent IDs 1001 through 1012 (12 records total,
derived from respondent_genre_interest.csv).

---

## CSV: genres.csv

10 rows. 3 columns.

| Column | Type | Example |
|---|---|---|
| genre_slug | string, PK | RQ.2.34 |
| genre_name | string | Coding / Robotics |
| genre_categories | string, pipe-delimited | Continuing Ed |

genre_categories is pipe-delimited when a genre belongs to multiple
categories. Example: How-To Content belongs to
"Continuing Ed|Entertainment|Hobby".

**All 10 genres:**

| slug | name | categories |
|---|---|---|
| RQ.2.34 | Coding / Robotics | Continuing Ed |
| RQ.2.38 | Cooking / Baking / Grilling | Food & Drink |
| RQ.2.48 | Documentary | Entertainment |
| RQ.2.57 | Fantasy Sports | Sports\|Gaming |
| RQ.2.78 | How-To Content | Continuing Ed\|Entertainment\|Hobby |
| RQ.2.97 | Meditation | Personal Care |
| RQ.2.125 | Reality programming / Reality TV | Entertainment |
| RQ.2.162 | Travel & tourism content | Entertainment\|Travel |
| RQ.2.172 | Wine | Food & Drink |
| RQ.2.173 | Yoga / Pilates | Sports\|Personal Care |

```sql
CREATE TABLE genres (
  genre_slug TEXT PRIMARY KEY,
  genre_name TEXT NOT NULL,
  genre_categories TEXT NOT NULL
);
```

---

## CSV: respondent_genre_interest.csv

120 rows. 3 columns. Every respondent has exactly 10 rows —
one per genre. No missing values.

| Column | Type | Notes |
|---|---|---|
| respondent_id | integer, FK → respondents | |
| genre_slug | string, FK → genres | |
| interest_level | integer | 1-5, INVERTED scale |

```sql
CREATE TABLE respondent_genre_interest (
  respondent_id INTEGER REFERENCES respondents(respondent_id),
  genre_slug TEXT REFERENCES genres(genre_slug),
  interest_level INTEGER NOT NULL CHECK (interest_level BETWEEN 1 AND 5),
  PRIMARY KEY (respondent_id, genre_slug)
);
```

---

## CRITICAL: Interest Scale Is Inverted

```
1 = highest interest    ← longest bar, sorted first, labeled HIGH
2 = interested
3 = neutral
4 = low interest
5 = unfamiliar / not interested  ← shortest bar, sorted last
```

**Every sort, every aggregation, every bar chart must account for
this inversion.** Sorting by interest_level ASC surfaces the most
interested genres first. Sorting DESC surfaces the least interested
genres first. The natural sort (ASC) is correct.

**Bar chart rendering:** bar length must be proportional to
(6 - interest_level) so that a score of 1 produces the longest
bar and a score of 5 produces the shortest. Never render raw
interest_level as bar length.

```
interest_level 1 → bar width = 5/5 = 100%
interest_level 2 → bar width = 4/5 = 80%
interest_level 3 → bar width = 3/5 = 60%
interest_level 4 → bar width = 2/5 = 40%
interest_level 5 → bar width = 1/5 = 20%
```

**Display label:** always show the raw interest_level number (1-5)
alongside the bar. Include a legend: "1 = highest interest" on
every view that shows interest scores. Do not rely on users
inferring the scale.

---

## Supabase Tables: Application Data

### audiences

Stores named, reusable audience segments defined by filter rules.

```sql
CREATE TABLE audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filter_definition JSONB NOT NULL,
  respondent_ids INTEGER[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**filter_definition schema:**
```json
{
  "filters": [
    { "genre_slug": "RQ.2.34", "max_level": 2 },
    { "genre_slug": "RQ.2.97", "max_level": 2 }
  ]
}
```

A respondent matches the audience if they satisfy ALL filters
(AND logic). A respondent satisfies a filter if their
interest_level for that genre_slug is <= max_level.

**respondent_ids** is a cached array derived from filter_definition.
It is computed at save time and stored for query performance.
If the underlying dataset changes, respondent_ids must be
recomputed from filter_definition.

**Decision rationale:** storing filter rules (not static ID arrays)
makes segments composable and extensible. When demographic data
is added to respondents, the same filter system can incorporate
new dimensions without schema changes.

---

### saved_outputs

Stores all LLM-generated outputs — both campaign concepts and
audience personas.

```sql
CREATE TABLE saved_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  output_type TEXT NOT NULL CHECK (output_type IN ('campaign_concept', 'persona')),
  audience_id UUID REFERENCES audiences(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  rya_score INTEGER CHECK (rya_score BETWEEN 1 AND 10),
  rya_rationale TEXT,
  channel TEXT,
  genre_signals_used JSONB NOT NULL,
  card_image_url TEXT,
  card_image_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

`card_image_url` and `card_image_prompt` are NULL until a card
image is generated on demand. `card_image_prompt` stores the
exact DALL-E 3 prompt written by gpt-4o-mini for traceability.

**content schema for campaign_concept:**
```json
{
  "title": "string",
  "concept": "string",
  "channel": "string",
  "rya_score": 6,
  "rya_rationale": "string citing specific genre data",
  "genre_signals_used": [
    { "genre_name": "Coding / Robotics", "avg_score": 1.0 },
    { "genre_name": "Travel & tourism content", "avg_score": 2.0 }
  ]
}
```

**content schema for persona:**
```json
{
  "persona_name": "string",
  "who_they_are": "string",
  "what_they_care_about": ["string citing genre", "string citing genre"],
  "what_does_not_resonate": ["string citing genre", "string citing genre"],
  "creative_direction": "string",
  "genre_signals_used": [
    { "genre_name": "Coding / Robotics", "avg_score": 1.0 }
  ]
}
```

rya_score, rya_rationale, and channel are NULL for persona outputs.
genre_signals_used is the specific subset of the audience's genre
data that was injected into the LLM prompt for this output.
This enables the traceability display on the detail view.

---

## Delta Visualization Formula

Used on the Audience Detail view to show how a segment differs
from the full population. This is the core insight surface.

```
population_avg(genre) = AVG(interest_level) across all 12 respondents
segment_avg(genre)    = AVG(interest_level) across segment respondents

delta = population_avg - segment_avg

positive delta → segment is MORE interested than average
                 (segment avg is lower, population avg is higher)
negative delta → segment is LESS interested than average
                 (segment avg is higher, population avg is lower)
```

**Display logic:**
- delta > 0.5: highlight in blue, label "▲ significantly more interested"
- delta 0.1 to 0.5: label "▲ more interested"
- delta -0.1 to 0.1: label "≈ similar to average"
- delta < -0.5: label "▼ less interested"

**Pre-computed population averages (all 12 respondents):**

| Genre | Population Avg |
|---|---|
| Travel & tourism content | 1.75 |
| Documentary | 2.08 |
| Cooking / Baking / Grilling | 2.17 |
| How-To Content | 2.25 |
| Meditation | 2.83 |
| Wine | 2.83 |
| Yoga / Pilates | 2.92 |
| Coding / Robotics | 3.25 |
| Reality programming / Reality TV | 3.50 |
| Fantasy Sports | 3.83 |

These values can be hardcoded as constants or computed at runtime
from the full respondent_genre_interest table.

---

## Four Audience Clusters (Reference Data for Testing)

The dataset contains 4 natural clusters. The app must NOT hardcode
these — they must be discoverable via the segment builder. This
data is provided for development and testing purposes only.

**Cluster 1 — Emerging Tech Professionals**
Respondents: 1001, 1002, 1003
Defining signal: How-To Content avg 1.0
Also interested: Coding / Robotics avg 1.33, Documentary avg 1.67, Travel avg 1.67

**Cluster 2 — Wellness-Oriented Parents**
Respondents: 1004, 1005, 1006
Defining signal: Meditation avg 1.0, Yoga / Pilates avg 1.0
Also interested: Cooking / Baking / Grilling avg 1.33, Travel avg 2.0, How-To Content avg 2.0

**Cluster 3 — Competitive Sports Fans**
Respondents: 1007, 1008, 1009
Defining signal: Fantasy Sports avg 1.0
Also interested: Reality TV avg 1.67

**Cluster 4 — Affluent Culture Seekers**
Respondents: 1010, 1011, 1012
Defining signal: Documentary avg 1.0, Wine avg 1.0, Travel avg 1.0
Also interested: Cooking avg 1.67

---

## Supabase Storage

### card-images bucket

Public bucket for DALL-E 3 generated card images. Created via
migration so `supabase start` sets it up automatically.

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true);
```

Images are stored as `{output_id}.png`. Public URL pattern:
`{SUPABASE_URL}/storage/v1/object/public/card-images/{output_id}.png`

A permissive storage policy allows all operations (no auth in scope):

```sql
CREATE POLICY "allow_all" ON storage.objects
  FOR ALL USING (bucket_id = 'card-images');
```

---

## RLS Policies

No user authentication is in scope. Configure permissive RLS
that allows all operations for anonymous users on all four tables.

```sql
ALTER TABLE respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE respondent_genre_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON respondents FOR ALL USING (true);
CREATE POLICY "allow_all" ON genres FOR ALL USING (true);
CREATE POLICY "allow_all" ON respondent_genre_interest FOR ALL USING (true);
CREATE POLICY "allow_all" ON audiences FOR ALL USING (true);
CREATE POLICY "allow_all" ON saved_outputs FOR ALL USING (true);
```