import { FastifyPluginAsync } from 'fastify';
import { getAllJobs, getJobById } from '../services/db';
import { tracer } from '../plugins/otel';

export const jobsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/jobs', {
    schema: {
      tags: ['Jobs'],
      summary: 'List all parsed job postings with optional filters',
      querystring: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          remoteType: { type: 'string' },
          minSalary: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    return tracer.startActiveSpan('jobs.list', async (span) => {
      try {
        const query = request.query as {
          role?: string;
          remoteType?: string;
          minSalary?: number;
        };
        const jobs = await getAllJobs(query);
        span.setAttribute('jobs.count', jobs.length);
        return { success: true, count: jobs.length, data: jobs };
      } catch (err: any) {
        span.recordException(err);
        reply.status(500).send({ success: false, error: err.message });
      } finally {
        span.end();
      }
    });
  });

  fastify.get('/api/v1/jobs/:id', {
    schema: {
      tags: ['Jobs'],
      summary: 'Get single job description by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await getJobById(id);
    if (!job) {
      return reply.status(404).send({ success: false, error: 'Job not found' });
    }
    return { success: true, data: job };
  });
};
