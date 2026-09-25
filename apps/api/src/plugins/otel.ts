import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { trace, Span, context } from '@opentelemetry/api';
import crypto from 'crypto';

export const tracer = trace.getTracer('job-matching-api');

// In-memory ring buffer of recent traces for dashboard visualization
export interface RecentTrace {
  traceId: string;
  spanId: string;
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  timestamp: string;
}

export const recentTraces: RecentTrace[] = [];

const otelPluginAsync: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    (request as any).startTime = Date.now();
    const activeSpan = trace.getSpan(context.active());
    let traceId = activeSpan?.spanContext().traceId;

    if (!traceId || traceId === '00000000000000000000000000000000') {
      traceId = crypto.randomBytes(16).toString('hex');
    }

    (request as any).traceId = traceId;
  });

  fastify.addHook('onSend', async (request, reply) => {
    const traceId = (request as any).traceId || crypto.randomBytes(16).toString('hex');
    reply.header('X-Trace-Id', traceId);

    const startTime = (request as any).startTime || Date.now();
    const durationMs = Date.now() - startTime;
    const activeSpan = trace.getSpan(context.active());
    const spanId = activeSpan?.spanContext().spanId || crypto.randomBytes(8).toString('hex');

    // Keep the latest 50 traces
    if (!request.url.startsWith('/api/v1/telemetry')) {
      recentTraces.unshift({
        traceId,
        spanId,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        durationMs,
        timestamp: new Date().toISOString(),
      });
      if (recentTraces.length > 50) {
        recentTraces.pop();
      }
    }
  });
};

export const otelPlugin = fp(otelPluginAsync, {
  name: 'otel-plugin',
});
