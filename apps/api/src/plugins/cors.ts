import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';

const corsPluginAsync: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['X-Trace-Id'],
  });
};

export const corsPlugin = fp(corsPluginAsync, {
  name: 'cors-plugin',
});
