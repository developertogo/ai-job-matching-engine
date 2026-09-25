import { FastifyPluginAsync } from 'fastify';
import { recentTraces } from '../plugins/otel';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Service health check',
    },
  }, async () => {
    return {
      status: 'healthy',
      service: 'job-matching-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  });

  fastify.get('/api/v1/telemetry/stats', {
    schema: {
      tags: ['Telemetry'],
      summary: 'Get telemetry metrics and trace summary',
    },
  }, async () => {
    const totalTraces = recentTraces.length;
    const avgDuration =
      totalTraces > 0
        ? Math.round(
            recentTraces.reduce((acc, t) => acc + t.durationMs, 0) / totalTraces
          )
        : 0;

    return {
      success: true,
      serviceName: 'job-matching-backend',
      activeTracing: true,
      stats: {
        totalRecordedRequests: totalTraces,
        avgLatencyMs: avgDuration,
      },
      recentTraces: recentTraces.slice(0, 20),
    };
  });

  // Alias for /api/v1/metrics/traces
  fastify.get('/api/v1/metrics/traces', async () => {
    return {
      success: true,
      traces: recentTraces.slice(0, 25),
    };
  });
};
