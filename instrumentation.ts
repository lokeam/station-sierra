/**
 * Next.js instrumentation hook — registers the OpenTelemetry SDK at startup.
 *
 * Exports traces to Arize Phoenix at localhost:6006 via OTLP protobuf.
 * Must use `exporter-trace-otlp-proto`, not `-http` — Phoenix rejects JSON.
 * Must target port 6006, not 4317 — Phoenix does not expose a gRPC endpoint.
 */

import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

/** Called by Next.js on server startup. Initializes OTLP trace export to Phoenix. */
export function register() {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: 'http://localhost:6006/v1/traces',
    }),
  })
  sdk.start()
}
