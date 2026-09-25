import { FastifyPluginAsync } from 'fastify';
import { getCandidateMatches, updateMatchStatus } from '../services/db';
import { tracer } from '../plugins/otel';

export const matchesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/candidates/:id/matches', {
    schema: {
      tags: ['Matches'],
      summary: 'Get top hybrid matches for a candidate',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    return tracer.startActiveSpan('matches.for_candidate', async (span) => {
      try {
        const { id } = request.params as { id: string };
        span.setAttribute('candidate.id', id);
        const matches = await getCandidateMatches(id);
        span.setAttribute('matches.count', matches.length);
        return { success: true, count: matches.length, data: matches };
      } catch (err: any) {
        span.recordException(err);
        reply.status(500).send({ success: false, error: err.message });
      } finally {
        span.end();
      }
    });
  });

  fastify.get('/api/v1/matches', {
    schema: {
      tags: ['Matches'],
      summary: 'List default candidate matches (cand-alex-chen)',
    },
  }, async (request, reply) => {
    const matches = await getCandidateMatches('cand-alex-chen');
    return { success: true, count: matches.length, data: matches };
  });

  fastify.post('/api/v1/matches/:id/status', {
    schema: {
      tags: ['Matches'],
      summary: 'Update match status (e.g. saved, applied, dismissed)',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'saved', 'applied', 'dismissed'] },
        },
        required: ['status'],
      },
    },
  }, async (request, reply) => {
    return tracer.startActiveSpan('matches.update_status', async (span) => {
      try {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };
        span.setAttribute('match.id', id);
        span.setAttribute('match.status', status);

        const updated = await updateMatchStatus(id, status);
        return { success: true, data: updated };
      } catch (err: any) {
        span.recordException(err);
        reply.status(500).send({ success: false, error: err.message });
      } finally {
        span.end();
      }
    });
  });
};
