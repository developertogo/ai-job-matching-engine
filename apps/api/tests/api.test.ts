import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/index';
import type { FastifyInstance } from 'fastify';

describe('Fastify Backend API (@job-engine/api)', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('GET /health returns healthy service status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.status, 'healthy');
    assert.strictEqual(body.service, 'job-matching-backend');
    assert.ok(typeof body.uptimeSeconds === 'number');
  });

  test('GET /api/v1/jobs returns parsed job listings and X-Trace-Id header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['x-trace-id'], 'Response must include X-Trace-Id header');

    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.count >= 3);
  });

  test('GET /api/v1/jobs/:id returns single job details', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs/job-founding-full-stack',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, 'job-founding-full-stack');
    assert.strictEqual(body.data.roleLevel, 'Founding');
  });

  test('GET /api/v1/jobs/:id returns 404 for non-existent job', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs/non-existent-id',
    });

    assert.strictEqual(res.statusCode, 404);
  });

  test('GET /api/v1/candidates/:id/matches returns ranked matches with AI rationale', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/candidates/cand-alex-chen/matches',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);

    const firstMatch = body.data[0];
    assert.ok(typeof firstMatch.score === 'number');
    assert.ok(typeof firstMatch.denseSimilarity === 'number');
    assert.ok(typeof firstMatch.graphSkillScore === 'number');
    assert.ok(firstMatch.aiRationale);
  });

  test('POST /api/v1/matches/:id/status updates match status', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/matches/match-1/status',
      payload: { status: 'applied' },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'applied');
  });

  test('GET /api/v1/ingest/status returns recent ingestion logs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/ingest/status',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  test('GET /api/v1/telemetry/stats returns recorded trace spans', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/telemetry/stats',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.activeTracing, true);
    assert.ok(body.stats.totalRecordedRequests > 0);
  });

  test('GET /docs returns OpenAPI Swagger documentation', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/docs',
    });

    assert.ok(res.statusCode === 200 || res.statusCode === 302, 'Swagger UI should return 200 or 302 redirect');
  });
});
