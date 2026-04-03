/**
 * App-wide OpenTelemetry tracer instance.
 *
 * Used by generation routes to create spans for each LLM call. Span attributes
 * (audience_id, attempt_number, eval results, sanitization flags) are set by
 * the route handlers in `app/api/generate/`.
 */

import { trace } from '@opentelemetry/api'

/** Singleton tracer — import this in route handlers to create spans. */
export const tracer = trace.getTracer('rya-lite')
