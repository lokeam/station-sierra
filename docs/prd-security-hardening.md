# PRD: Security & Error Handling Hardening

## Problem Statement

Station Sierra is a small proof of concept application built to production standards given a strict timeline. The application works end-to-end, but a security audit revealed gaps in error handling, input validation, and defensive coding that could leave a negative impression on reviewers. Specifically: the frontend has no error boundaries (crashes show a white screen), several API routes leak internal error details or re-throw unhandled exceptions, one user-input field bypasses prompt-injection sanitization, and server-rendered pages don't check for database failures before rendering. These are the kinds of issues that distinguish a "vibe-coded" prototype from a founding-engineer-quality submission.

## Solution

Harden the application across three layers — frontend resilience, backend input validation and error handling, and infrastructure-level safeguards — without adding scope that contradicts the PRD (no auth, no production deployment). Every fix should be minimal, targeted, and defensible in a code review.

## User Stories

1. As a reviewer, I want the app to show a styled error page when a React component throws, so that I see graceful degradation instead of a white screen.
2. As a reviewer, I want to see a custom 404 page when I navigate to a non-existent route, so that I know the developer considered navigation edge cases.
3. As a reviewer, I want to see loading skeletons while pages fetch data, so that the app feels intentional rather than hanging on slow connections.
4. As a reviewer, I want API routes to return structured JSON error responses for all failure modes (400, 404, 422, 500), so that I never see a raw Next.js error page or leaked stack trace.
5. As a reviewer, I want the `brand_name` field sanitized against prompt injection the same way `brief` is, so that I can verify the developer identified all user-input surfaces injected into LLM prompts.
6. As a reviewer, I want API routes that accept structured input (audiences, outputs) to validate the shape and types with Zod schemas, so that I can verify the developer doesn't trust client-side code to send correct data.
7. As a user, I want to see an error message when saving, deleting, or generating a card image fails, so that I know the action didn't succeed and can retry.
8. As a user, I want pages to show a meaningful error state when the database is unreachable, so that I'm not staring at a broken page with missing data.
9. As a reviewer, I want the app to fail fast with a clear message if required environment variables are missing, so that setup errors are obvious.
10. As a reviewer, I want API routes to reject oversized request bodies, so that I can see the developer thought about resource exhaustion.
11. As a reviewer, I want to see evidence that the developer considered CSRF and can explain why it's mitigated in this architecture, so that I know they understand web security beyond a checkbox list.

## Implementation Decisions

### Module 1 — Global Error Boundary & Navigation Guards

Create three new files in the Next.js App Router:

- `app/error.tsx` — Client-side error boundary. Catches any unhandled React error in child routes. Displays a styled error message with a "Try Again" button that calls `reset()`. Must be a client component (`'use client'`).
- `app/not-found.tsx` — Custom 404 page. Displays a styled message with a link back to the respondents page.
- `app/loading.tsx` — Global loading fallback. Displays a centered spinner matching the app's design system. Individual route segments can override this with their own `loading.tsx` if needed, but the global one provides a baseline.

### Module 2 — API Route Error Handling Fixes

Three targeted fixes to existing route files:

- **Generate routes catch block**: Replace `throw err` with a structured `NextResponse.json({ error: 'internal_error', detail: 'An unexpected error occurred' }, { status: 500 })`. Sanitize the span error message to avoid leaking exception details into Phoenix. Applies to concept, persona, and card-image routes.
- **Audiences route error response**: Replace `{ error: error.message }` with `{ error: 'db_error', detail: 'Failed to create audience' }` to match the pattern already used in the outputs route.
- **Request body size limit**: Add `export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }` to route segments, or configure globally in `next.config.ts` if supported by App Router. This is a one-line defense against memory exhaustion via oversized payloads.

### Module 3 — Brand Name Sanitization

Run the existing `sanitizeBrief()` function on `brand_name` in the concept generation route, the same way it's already applied to `brief`. Log the result to the Phoenix span as `security.brand_name_sanitized` and `security.brand_name_patterns_matched`. This closes the only remaining user-input-to-LLM-prompt path that bypasses sanitization.

### Module 4 — Zod Validation on CRUD Routes

Add Zod schemas to validate the request body in:

- `POST /api/audiences` — Validate `name` (string, min 1, max 200), `filter_definition` (object with `filters` array where each entry has `genre_slug: string` and `max_level: number 1-5`), `respondent_ids` (array of positive integers).
- `POST /api/outputs` — Validate `output_type` (enum: `campaign_concept` | `persona`), `audience_id` (string, UUID format), `title` (string, min 1), `content` (object), `genre_signals_used` (array of objects with `genre_name: string` and `avg_score: number`). Nullable fields (`rya_score`, `rya_rationale`, `channel`) validated as correct type or null.

Return 400 with a generic "Invalid request format" message on validation failure. Do not echo Zod error details back to the client.

### Module 5 — Frontend Error Feedback

Add error states to three existing handlers that currently fail silently:

- `generate-panel.tsx` save handler — Show an inline error message when `res.ok` is false.
- `output-detail.tsx` delete handler — Show an error message when delete fails.
- `output-detail.tsx` card image handler — Show an error message when image generation fails.

Pattern: add a `useState<string>('')` for each error, set it on failure, clear it on retry, render it as a small red text element near the action button.

### Module 6 — Server Page Database Error Checking

All server component pages that fetch from Supabase (`respondents/page.tsx`, `audiences/page.tsx`, `concepts/page.tsx`, `audiences/[id]/page.tsx`, `concepts/[id]/page.tsx`, `layout.tsx`) currently destructure `{ data }` without checking the `error` field. Add error checks that throw so the nearest error boundary catches them. The layout's `getCounts()` helper should use fallback values (0) instead of throwing, since a layout crash is unrecoverable.

### Module 7 — Environment Variable Validation

Add a validation guard in `lib/supabase.ts` that checks all required env vars exist before creating clients. Replace the `!` non-null assertions with explicit checks that throw a descriptive error at startup:

```
Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL
```

This surfaces configuration problems immediately instead of producing cryptic runtime failures on first database call.

### Module 8 — CSRF Awareness Comment

Add a brief comment block at the top of one representative API route (e.g., the concept generation route) explaining why CSRF protection is not implemented:

> CSRF is mitigated by architecture: Next.js App Router API routes require explicit `Content-Type: application/json` headers. Browsers will not send JSON payloads cross-origin without a CORS preflight, and no permissive CORS policy is configured. This makes classic CSRF attacks (form submissions, image tags) ineffective against these endpoints.

This demonstrates security reasoning without adding unnecessary code.

## Testing Decisions

### What makes a good test

These are hardening fixes, not new features. The right verification is manual: trigger each error condition and confirm the user sees a styled error state instead of a crash or silent failure.

### Modules under test

No new automated tests. The existing eval and genre-signals unit tests already cover the core business logic. The fixes in this PRD are infrastructure-level (error boundaries, input validation, error responses) that are best verified by:

- Manually navigating to a non-existent route to confirm the 404 page
- Stopping Supabase and loading a page to confirm the error boundary
- Sending malformed payloads via curl to confirm 400 responses
- Submitting a brand_name with injection patterns to confirm sanitization

If time allows, a single integration test that sends a malformed body to `POST /api/audiences` and asserts a 400 response would demonstrate the validation works.

## Out of Scope

- **Authentication/authorization** — PRD explicitly excludes this. Adding it contradicts the spec.
- **Rate limiting** — No auth means rate limiting by IP is trivially bypassed. Adds complexity without real protection in this context.
- **CORS configuration** — App is same-origin by default. Configuring CORS for a local-only app is meaningless.
- **API versioning** — No external consumers exist. This would be resume-driven development.
- **CSRF middleware** — Mitigated by architecture (JSON content-type + no permissive CORS). Explained via comment instead.
- **Comprehensive penetration testing** — Out of scope for a take-home exercise.

## Further Notes

- Every fix in this PRD is scoped to be individually reviewable and small. No fix should touch more than one concern.
- The goal is not to make the app "production-ready" — it's to demonstrate that the developer thinks about failure modes, validates trust boundaries, and handles errors gracefully within the scope provided.
- The Supabase client architecture (separate anon key client vs service role client) and parameterized query patterns are already correct and require no changes.
- The existing `sanitizeBrief()` function and eval layer are solid. This PRD extends their coverage to the one gap found (brand_name).
