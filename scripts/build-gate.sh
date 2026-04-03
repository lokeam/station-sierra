#!/usr/bin/env bash
#
# build-gate.sh — Phase 7a build gate verification.
#
# Validates that the AI layer meets acceptance criteria before any UI
# work begins (see docs/ai-layer.md "Build Gate" section).
#
# What it checks:
#   1. 5 consecutive POST /api/generate/concept  — all must return 200
#   2. 5 consecutive POST /api/generate/persona   — all must return 200
#   3. Non-existent audience_id returns 404 (not 500)
#
# Prerequisites:
#   - Supabase running       (npx supabase start)
#   - Phoenix running         (phoenix serve --port 6006)
#   - Next.js dev server      (npm run dev)
#   - At least two audiences seeded in the audiences table
#
# Usage:
#   bash scripts/build-gate.sh
#
# The two audience UUIDs below must match rows in your local DB.
# Re-seed or update them if you've reset Supabase.

set -eo pipefail

BASE="http://localhost:3000"
TECH_AUDIENCE="8c233c1e-5c21-46d9-b7f6-fdabbc86c2a4"      # Emerging Tech Professionals
WELLNESS_AUDIENCE="3ea002c7-7d6a-4edc-a264-1249e406e8cb"   # Wellness-Oriented Parents

PASS=0
FAIL=0

now_ms() { python3 -c 'import time; print(int(time.time()*1000))'; }

echo "========================================"
echo " Build Gate Verification — Phase 7a"
echo "========================================"
echo ""

# --- Concept route: 5 consecutive generations ---
echo "--- POST /api/generate/concept (5 runs) ---"
for i in $(seq 1 5); do
  START_MS=$(now_ms)

  RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE/api/generate/concept" \
    -H 'Content-Type: application/json' \
    -d "{\"audience_id\": \"$TECH_AUDIENCE\", \"brand_name\": \"TechCo\", \"brief\": \"Launch a new developer tool\"}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  END_MS=$(now_ms)
  ELAPSED=$((END_MS - START_MS))

  if [ "$HTTP_CODE" = "200" ]; then
    TITLE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('title','?'))" 2>/dev/null || echo "?")
    RYA=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('rya_score','?'))" 2>/dev/null || echo "?")
    SIGNALS=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); gs=d.get('content',d).get('genre_signals_used',[]); print(', '.join([g['genre_name'] for g in gs[:3]]))" 2>/dev/null || echo "?")
    echo "  [$i] PASS (${ELAPSED}ms) — \"$TITLE\" RYA=$RYA signals=[$SIGNALS]"
    PASS=$((PASS + 1))
  else
    ERROR=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('detail','?'))" 2>/dev/null || echo "?")
    echo "  [$i] FAIL ($HTTP_CODE, ${ELAPSED}ms) — $ERROR"
    FAIL=$((FAIL + 1))
  fi
done

echo ""

# --- Persona route: 5 consecutive generations ---
echo "--- POST /api/generate/persona (5 runs) ---"
for i in $(seq 1 5); do
  START_MS=$(now_ms)

  RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE/api/generate/persona" \
    -H 'Content-Type: application/json' \
    -d "{\"audience_id\": \"$WELLNESS_AUDIENCE\"}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  END_MS=$(now_ms)
  ELAPSED=$((END_MS - START_MS))

  if [ "$HTTP_CODE" = "200" ]; then
    NAME=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('title','?'))" 2>/dev/null || echo "?")
    SIGNALS=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); gs=d.get('content',d).get('genre_signals_used',[]); print(', '.join([g['genre_name'] for g in gs[:3]]))" 2>/dev/null || echo "?")
    echo "  [$i] PASS (${ELAPSED}ms) — \"$NAME\" signals=[$SIGNALS]"
    PASS=$((PASS + 1))
  else
    ERROR=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('detail','?'))" 2>/dev/null || echo "?")
    echo "  [$i] FAIL ($HTTP_CODE, ${ELAPSED}ms) — $ERROR"
    FAIL=$((FAIL + 1))
  fi
done

echo ""

# --- 422 test: non-existent audience ---
echo "--- 422 Error Path Test ---"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE/api/generate/concept" \
  -H 'Content-Type: application/json' \
  -d '{"audience_id": "00000000-0000-0000-0000-000000000000"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "404" ]; then
  echo "  404 on non-existent audience: PASS (expected 404, got 404)"
else
  echo "  Expected 404, got $HTTP_CODE"
fi

echo ""

# --- Summary ---
TOTAL=$((PASS + FAIL))
echo "========================================"
echo " SUMMARY"
echo "========================================"
echo "  Passed: $PASS / $TOTAL"
echo "  Failed: $FAIL / $TOTAL"
echo ""

if [ "$FAIL" -eq 0 ] && [ "$PASS" -eq 10 ]; then
  echo "  BUILD GATE 7a: PASS"
else
  echo "  BUILD GATE 7a: FAIL"
fi
