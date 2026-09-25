// Initialize OpenTelemetry SDK before all other imports
import './telemetry';

import fastify from 'fastify';
import { corsPlugin } from './plugins/cors';
import { otelPlugin } from './plugins/otel';
import { swaggerPlugin } from './plugins/swagger';
import { jobsRoutes } from './routes/jobs';
import { matchesRoutes } from './routes/matches';
import { ingestRoutes } from './routes/ingest';
import { healthRoutes } from './routes/health';

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

export async function buildApp() {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Core Plugins
  await app.register(corsPlugin);
  await app.register(otelPlugin);
  await app.register(swaggerPlugin);

  // Application Routes
  await app.register(jobsRoutes);
  await app.register(matchesRoutes);
  await app.register(ingestRoutes);
  await app.register(healthRoutes);

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 Fastify Backend listening at http://${HOST}:${PORT}`);
    console.log(`📚 Swagger OpenAPI docs available at http://${HOST}:${PORT}/docs`);
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
