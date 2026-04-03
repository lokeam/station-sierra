# Plan: Security & Error Handling Hardening

> Source PRD: docs/prd-security-hardening.md

## Architectural decisions

Durable decisions that apply across all phases:

- **Error response shape**: All API errors return `{ error: string, detail: string }` with appropriate HTTP status codes (400, 404, 422, 500). Never leak internal error messages, stack traces, or Supabase error details to the client.
- **Validation library**: Zod for request body validation on CRUD routes. Return 400 with a generic "Invalid request format" message on failure — do not echo Zod error details.
- **Error boundaries**: Next.js App Router file conventions (`error.tsx`, `not-found.tsx`, `loading.tsx`) at the `app/` root. Individual route segments can override with their own if needed.
- **Sanitization**: The existing `sanitizeBrief()` function in `lib/sanitize.ts` is the single sanitization primitive. Extend its usage to all user-input-to-LLM-prompt paths rather than creating new sanitizers.
- **No new dependencies**: All fixes use existing packages (Zod is already installed). No auth, rate limiting, or CORS middleware added.

---

## Phase 1: Global Error Boundary & Navigation Guards

**User stories**: 1, 2, 3

### What to build

Three new files in the App Router root that provide baseline resilience for every route in the application. A client-side error boundary catches unhandled React errors and displays a styled error page with a "Try Again" button. A custom 404 page catches navigation to non-existent routes. A global loading fallback displays a centered spinner while pages fetch data. All three match the existing design system (light/dark mode, Tailwind, consistent spacing).

### Acceptance criteria

- [ ] `app/error.tsx` is a client component that catches React errors and renders a styled error message with a `reset()` button
- [ ] `app/not-found.tsx` renders a styled 404 page with a link back to the respondents page
- [ ] `app/loading.tsx` renders a centered spinner matching the app's design system
- [ ] Navigating to a non-existent route (e.g., `/nonexistent`) shows the custom 404 page
- [ ] Throwing an error in a page component shows the error boundary, not a white screen

---

## Phase 2: Infrastructure Safeguards

**User stories**: 9, 11

### What to build

Two small, independent hardening fixes. First, replace the `!` non-null assertions on environment variables in the Supabase client module with explicit existence checks that throw a descriptive error message at startup (e.g., `Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL`). Second, add a comment block at the top of one representative API route explaining why CSRF protection is not implemented and why the architecture mitigates classic CSRF vectors.

### Acceptance criteria

- [ ] Removing any required env var causes a clear, immediate error message naming the missing variable — not a cryptic runtime failure on first database call
- [ ] All three env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are validated
- [ ] CSRF comment block exists on one representative API route and explains the JSON content-type + no permissive CORS mitigation

---

## Phase 3: API Route Error Handling

**User stories**: 4

### What to build

Targeted fixes to error handling in existing API route files. The generate routes (concept, persona, card-image) have a catch block that re-throws unhandled exceptions — replace with a structured 500 JSON response. The audiences route leaks `error.message` from Supabase — replace with a generic error response matching the pattern already used in the outputs route. Sanitize span error messages in generate routes to avoid leaking exception details into Phoenix.

### Acceptance criteria

- [ ] Generate routes (concept, persona, card-image) return `{ error: 'internal_error', detail: 'An unexpected error occurred' }` with status 500 on unhandled exceptions — never re-throw
- [ ] Audiences route returns `{ error: 'db_error', detail: 'Failed to create audience' }` instead of `error.message`
- [ ] No API route returns a raw Next.js error page or leaked stack trace for any failure mode
- [ ] Phoenix spans for failed generations record a sanitized error message, not the raw exception

---

## Phase 4: Input Validation & Sanitization

**User stories**: 5, 6

### What to build

Two related input-hardening fixes. First, add Zod schemas to validate the request body in the audiences and outputs CRUD routes, returning 400 with a generic message on validation failure. Second, run the existing `sanitizeBrief()` function on `brand_name` in the concept generation route — the only remaining user-input-to-LLM-prompt path that bypasses sanitization — and log the result to the Phoenix span.

### Acceptance criteria

- [ ] `POST /api/audiences` validates `name` (string, min 1, max 200), `filter_definition` (object with `filters` array, each entry having `genre_slug: string` and `max_level: number 1-5`), and `respondent_ids` (array of positive integers)
- [ ] `POST /api/outputs` validates `output_type` (enum), `audience_id` (UUID), `title` (string, min 1), `content` (object), `genre_signals_used` (array of objects). Nullable fields validated as correct type or null.
- [ ] Both routes return 400 with `{ error: 'validation_error', detail: 'Invalid request format' }` on malformed input — Zod error details are not echoed
- [ ] `brand_name` is sanitized via `sanitizeBrief()` in the concept generation route before prompt construction
- [ ] Phoenix span includes `security.brand_name_sanitized` and `security.brand_name_patterns_matched` attributes
- [ ] Sending a `brand_name` containing "ignore all instructions" results in `[removed]` in the prompt

---

## Phase 5: Server Page Database Error Checking

**User stories**: 8

### What to build

Add error field checks to all server component pages that query Supabase. Currently these pages destructure `{ data }` without checking the `error` field, resulting in silent failures where missing data renders as empty UI. Pages should throw on database errors so the nearest error boundary (from Phase 1) catches them. The layout's `getCounts()` helper is a special case — it should use fallback values (0) instead of throwing, since a layout crash is unrecoverable.

### Acceptance criteria

- [ ] All server pages (`respondents/page.tsx`, `audiences/page.tsx`, `concepts/page.tsx`, `audiences/[id]/page.tsx`, `concepts/[id]/page.tsx`) check the Supabase `error` field and throw on failure
- [ ] `layout.tsx` `getCounts()` falls back to 0 on error instead of throwing
- [ ] When Supabase is unreachable, pages show the error boundary instead of rendering with missing data
- [ ] The error boundary from Phase 1 catches and displays these errors gracefully

---

## Phase 6: Frontend Error Feedback

**User stories**: 7

### What to build

Add visible error states to three existing client-side handlers that currently fail silently or swallow errors. The save handler in the generate panel, the delete handler in the output detail view, and the card image generation handler in the output detail view should each display an inline error message when the operation fails. Pattern: `useState` for error text, set on failure, clear on retry, render as small red text near the action button.

### Acceptance criteria

- [ ] Generate panel save handler shows an inline error message when `res.ok` is false
- [ ] Output detail delete handler shows an error message when the delete request fails
- [ ] Output detail card image handler shows an error message when image generation fails
- [ ] Error messages clear when the user retries the action
- [ ] Error text is visible, styled in red, and positioned near the relevant action button

---

## Phase 7: Request Body Size Limit

**User stories**: 10

### What to build

Configure a request body size limit to defend against memory exhaustion via oversized payloads. Add the limit globally via `next.config.ts` if supported by App Router, or per-route via the route segment config export. Target limit: 1 MB — large enough for any legitimate request, small enough to prevent abuse.

### Acceptance criteria

- [ ] Requests with bodies exceeding 1 MB are rejected before reaching route handler logic
- [ ] The rejection returns an appropriate HTTP error status (413 or 400)
- [ ] Normal-sized requests (audience creation, output saving, generation) are unaffected