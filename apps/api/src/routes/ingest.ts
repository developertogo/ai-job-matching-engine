import { FastifyPluginAsync } from 'fastify';
import { getRecentIngestionLogs } from '../services/db';
import { tracer } from '../plugins/otel';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execAsync = util.promisify(exec);

export const ingestRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/ingest/status', {
    schema: {
      tags: ['Ingestion'],
      summary: 'Get recent ingestion pipeline logs and batch statuses',
    },
  }, async (request, reply) => {
    return tracer.startActiveSpan('ingest.status', async (span) => {
      try {
        const logs = await getRecentIngestionLogs();
        span.setAttribute('logs.count', logs.length);
        return { success: true, count: logs.length, data: logs };
      } catch (err: any) {
        span.recordException(err);
        reply.status(500).send({ success: false, error: err.message });
      } finally {
        span.end();
      }
    });
  });

  fastify.post('/api/v1/ingest/trigger', {
    schema: {
      tags: ['Ingestion'],
      summary: 'Trigger real Python AI ingestion pipeline',
    },
  }, async (request, reply) => {
    return tracer.startActiveSpan('ingest.trigger', async (span) => {
      try {
        const pipelineDir = path.resolve(__dirname, '../../../ai-pipeline');
        const venvPython = path.join(pipelineDir, '.venv/bin/python');
        const scriptPath = path.join(pipelineDir, 'pipeline/ingestion.py');

        // Prefer venv python, fall back to python3
        const pythonCmd = `"${venvPython}" "${scriptPath}" 2>&1 || python3 "${scriptPath}" 2>&1`;

        span.setAttribute('pipeline.command', pythonCmd);
        const { stdout, stderr } = await execAsync(pythonCmd, { cwd: pipelineDir });

        const logs = await getRecentIngestionLogs();
        const latest = logs[0] || null;

        return {
          success: true,
          message: 'Ingestion pipeline executed successfully',
          output: stdout.trim(),
          latestBatch: latest,
        };
      } catch (err: any) {
        span.recordException(err);
        reply.status(500).send({
          success: false,
          error: err.message,
          output: err.stdout || err.stderr,
        });
      } finally {
        span.end();
      }
    });
  });

  // Alias for /api/v1/ingest/run
  fastify.post('/api/v1/ingest/run', async (request, reply) => {
    return fastify.inject({
      method: 'POST',
      url: '/api/v1/ingest/trigger',
    });
  });
};
