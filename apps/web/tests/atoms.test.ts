import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from 'jotai';
import {
  rolePromptAtom,
  userEmailAtom,
  submissionStatusAtom,
  detectedSkillsAtom,
  KNOWN_KEYWORDS,
} from '../lib/atoms/promptAtoms';

describe('Frontend Jotai Atomic State (@job-engine/web)', () => {
  test('should initialize prompt and email atoms with default values', () => {
    const store = createStore();
    assert.strictEqual(store.get(rolePromptAtom), '');
    assert.strictEqual(store.get(userEmailAtom), '');
    assert.strictEqual(store.get(submissionStatusAtom), 'idle');
    assert.deepStrictEqual(store.get(detectedSkillsAtom), []);
  });

  test('should detect technical keywords in real-time as user types', () => {
    const store = createStore();

    store.set(
      rolePromptAtom,
      'I am a Founding Full Stack Engineer with strong TypeScript, Next.js, and Fastify backend experience seeking a remote role.'
    );

    const detected = store.get(detectedSkillsAtom);
    assert.ok(detected.includes('TypeScript'));
    assert.ok(detected.includes('Next.js'));
    assert.ok(detected.includes('Fastify'));
    assert.ok(detected.includes('Remote'));
    assert.ok(detected.includes('Founding'));
  });

  test('should detect AI & ML keywords accurately with case-insensitivity', () => {
    const store = createStore();

    store.set(
      rolePromptAtom,
      'Looking for opportunities in python with pytorch and ollama embeddings, working with turso and sqlite.'
    );

    const detected = store.get(detectedSkillsAtom);
    assert.ok(detected.includes('Python'));
    assert.ok(detected.includes('PyTorch'));
    assert.ok(detected.includes('Ollama'));
    assert.ok(detected.includes('Embeddings'));
    assert.ok(detected.includes('Turso'));
    assert.ok(detected.includes('SQLite'));
  });

  test('should handle empty input and irrelevant text without false positives', () => {
    const store = createStore();

    store.set(rolePromptAtom, '');
    assert.deepStrictEqual(store.get(detectedSkillsAtom), []);

    store.set(rolePromptAtom, 'I like cooking pasta on the weekend and hiking.');
    assert.deepStrictEqual(store.get(detectedSkillsAtom), []);
  });

  test('should update email and submission status atoms', () => {
    const store = createStore();

    store.set(userEmailAtom, 'founder@matcha.fm');
    assert.strictEqual(store.get(userEmailAtom), 'founder@matcha.fm');

    store.set(submissionStatusAtom, 'parsing');
    assert.strictEqual(store.get(submissionStatusAtom), 'parsing');

    store.set(submissionStatusAtom, 'success');
    assert.strictEqual(store.get(submissionStatusAtom), 'success');
  });
});
