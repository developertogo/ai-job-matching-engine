import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { db, schema, libsqlClient } from '../src/index';
import { migrate } from '../src/migrate';
import { eq } from 'drizzle-orm';

describe('Database Layer (@job-engine/db)', () => {
  before(async () => {
    await migrate();
  });

  test('should connect to database and query skills table', async () => {
    const allSkills = await db.select().from(schema.skills);
    assert.ok(Array.isArray(allSkills));
    assert.ok(allSkills.length > 0, 'Skills table should contain seeded ontology vertices');
  });

  test('should verify skill graph edges and weights', async () => {
    const edges = await db.select().from(schema.skillEdges);
    assert.ok(edges.length > 0);
    const expressEdge = edges.find(
      (e) => e.sourceSkillId === 'express' && e.targetSkillId === 'fastify'
    );
    assert.ok(expressEdge, 'Express -> Fastify ontology edge should exist');
    assert.strictEqual(expressEdge?.relationship, 'alternative_to');
    assert.strictEqual(expressEdge?.weight, 0.8);
  });

  test('should query jobs and verify 768-dim float32 vector embedding blob', async () => {
    const jobsList = await db.select().from(schema.jobs);
    assert.ok(jobsList.length >= 3, 'Should contain at least the 3 Founding JDs');

    const fullStackJob = jobsList.find((j) => j.id === 'job-founding-full-stack');
    assert.ok(fullStackJob);
    assert.strictEqual(fullStackJob?.roleLevel, 'Founding');
    assert.ok(fullStackJob?.embedding instanceof Buffer || fullStackJob?.embedding instanceof Uint8Array);
    // 768 float32 values = 768 * 4 = 3072 bytes
    assert.strictEqual((fullStackJob?.embedding as Buffer).byteLength, 3072);
  });

  test('should query candidates and update match status', async () => {
    const candidatesList = await db.select().from(schema.candidates);
    assert.ok(candidatesList.length > 0);

    const matchesList = await db.select().from(schema.matches);
    assert.ok(matchesList.length > 0);

    const targetMatch = matchesList[0];
    const newStatus = targetMatch.status === 'saved' ? 'applied' : 'saved';

    await db
      .update(schema.matches)
      .set({ status: newStatus })
      .where(eq(schema.matches.id, targetMatch.id));

    const updated = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.id, targetMatch.id));

    assert.strictEqual(updated[0].status, newStatus);
  });

  test('should track ingestion logs in database', async () => {
    const logs = await db.select().from(schema.ingestionLogs);
    assert.ok(logs.length > 0);
    assert.ok(logs[0].batchId);
    assert.ok(logs[0].status);
  });
});
