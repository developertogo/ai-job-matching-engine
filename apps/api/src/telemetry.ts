import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

if (process.env.OTEL_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
});

export const otelSdk = new NodeSDK({
  serviceName: 'job-matching-backend',
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
    }),
    new FastifyInstrumentation(),
  ],
});

try {
  otelSdk.start();
  console.log('🔭 OpenTelemetry NodeSDK initialized.');
} catch (err) {
  console.warn('⚠️ OpenTelemetry SDK start failed (non-blocking):', err);
}

process.on('SIGTERM', () => {
  otelSdk
    .shutdown()
    .then(() => console.log('🔭 OpenTelemetry SDK terminated.'))
    .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
    .finally(() => process.exit(0));
});
