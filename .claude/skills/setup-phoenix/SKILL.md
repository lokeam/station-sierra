---
name: phoenix-setup
description: This skill should be used when setting up Arize Phoenix for LLM observability, including installation, OTLP exporter configuration, instrumentation.ts setup, tracer initialization, and wiring span attributes to generation traces.
---

# Phoenix Setup Skill

This skill provides the complete setup instructions for Arize
Phoenix local LLM observability. Every LLM call in the
generate → evaluate → refine loop must produce a visible trace.
This is non-optional per the build gate.

## Reference File

Full span attributes list and configuration details live in:
`references/span-attributes.md`

Load that file when wiring span attributes to generation calls.

## Key Rules

1. Phoenix must be running before npm run dev — startup order matters
2. Without the OTLP exporter in instrumentation.ts, trace.getTracer()
   returns a no-op tracer and nothing reaches Phoenix
3. instrumentationHook: true must be set in next.config.js
4. One span per generation request, covering the full loop
5. Span attributes are set during the loop — token counts and
   latency are summed across all attempts
6. Failed spans use SpanStatusCode.ERROR, not just an attribute

## Startup Order (document in README)

```
1. supabase start
2. python -m phoenix.server.main serve
3. npm run dev
```

Phoenix UI: http://localhost:6006
OTLP endpoint: http://localhost:4317

## Process

1. Install: pip install arize-phoenix
2. Create instrumentation.ts at project root (see below)
3. Set experimentalInstrumentationHook in next.config.js
4. Create /lib/telemetry.ts with tracer export
5. Read references/span-attributes.md
6. Wire all required span attributes in API route handlers
7. Run a test generation and verify trace appears in Phoenix UI
8. Confirm eval.final_pass and eval.groundedness_pass attributes
   are present and correct on the trace

## instrumentation.ts

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

export function register() {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: 'http://localhost:4317/v1/traces',
    }),
  })
  sdk.start()
}
```

## next.config.js

```javascript
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
}
```

## /lib/telemetry.ts

```typescript
import { trace } from '@opentelemetry/api'
export const tracer = trace.getTracer('rya-lite')
```

## On Eval Failure — Span Status

```typescript
import { SpanStatusCode } from '@opentelemetry/api'

span.setStatus({
  code: SpanStatusCode.ERROR,
  message: `eval failed after ${attempts} attempts: ${detail}`
})
span.setAttribute('eval.failure_detail', detail)
span.end()
```