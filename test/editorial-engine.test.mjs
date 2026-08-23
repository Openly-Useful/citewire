import assert from 'node:assert/strict';
import test from 'node:test';
import { createEditorialEngine } from '../src/editorial/engine.js';
import { publicationKey, workKey } from '../src/editorial/idempotency.js';
import { MemoryEditorialStore } from '../src/editorial/memory-store.js';
import { createPauseController } from '../src/editorial/pause.js';
import { classifyFailure, nextRetry } from '../src/editorial/retry.js';
import { ASSESSMENT_SCHEDULES } from '../src/editorial/schedules.js';

const NOW = '2026-08-16T12:00:00.000Z';

function item(id = 'item-1') {
  return {
    id,
    revision: 'rev-1',
    state: 'fetched',
    title: 'Grid research',
    publisher: 'Example',
    published_at: NOW,
    canonical_url: `https://example.test/${id}`,
    source_id: 'source-1',
  };
}

function classifier() {
  return {
    mode: 'shadow',
    abstained: false,
    inclusion_tier: 'standard',
    inclusion_reasons: ['STANDARD_BAND'],
    score: 0.8,
    classifier_version: 'classifier-1',
  };
}

test('pause defaults true and idempotent replay detects payload conflicts', () => {
  const store = new MemoryEditorialStore();
  const pause = createPauseController(store, () => NOW);
  assert.equal(pause.get().paused, true);
  const first = pause.set({ paused: false, reason: 'TEST_ONLY', idempotencyKey: 'pause-1' });
  assert.deepEqual(pause.set({ paused: false, reason: 'TEST_ONLY', idempotencyKey: 'pause-1' }), first);
  assert.throws(() => pause.set({ paused: true, reason: 'DIFFERENT', idempotencyKey: 'pause-1' }), /IDEMPOTENCY_CONFLICT/);
});

test('independent gates advance through verification but publication stays disabled', async () => {
  const store = new MemoryEditorialStore();
  store.createItem({ accountId: 'account-a', item: item() });
  const pause = createPauseController(store, () => NOW);
  pause.set({ paused: false, reason: 'TEST_ONLY', idempotencyKey: 'resume-1' });
  const engine = createEditorialEngine({
    store,
    pauseController: pause,
    rightsEvaluator: async () => ({ allowed: true, decision: 'allow', reasons: [] }),
    classifier: async () => classifier(),
    summarizer: async () => ({ ok: true, summary: 'Metadata-based summary.', summary_hash: 'summary-1' }),
    verifier: async () => ({ verified: true, reason_codes: [], verifier_version: 'verifier-1' }),
    now: () => NOW,
  });

  for (const version of [1, 2, 3, 4]) {
    await engine.process({ accountId: 'account-a', itemId: 'item-1', expectedVersion: version, runId: `run-${version}` });
  }
  assert.equal(store.getItem('account-a', 'item-1').state, 'verified');
  const held = await engine.process({ accountId: 'account-a', itemId: 'item-1', expectedVersion: 5, runId: 'run-5', context: { calibration: { status: 'passed' } } });
  assert.equal(held.item.state, 'held');
  assert.ok(held.trace.events.at(-1).reason_codes.includes('AUTOMATED_PUBLICATION_DISABLED'));
});

test('concurrent workers cannot both advance one item version', async () => {
  const store = new MemoryEditorialStore();
  store.createItem({ accountId: 'account-a', item: item('race') });
  const pause = createPauseController(store, () => NOW);
  pause.set({ paused: false, reason: 'TEST_ONLY', idempotencyKey: 'resume-race' });
  const engine = createEditorialEngine({
    store,
    pauseController: pause,
    rightsEvaluator: async () => ({ allowed: true, decision: 'allow', reasons: [] }),
    now: () => NOW,
  });
  const results = await Promise.allSettled([
    engine.process({ accountId: 'account-a', itemId: 'race', expectedVersion: 1, runId: 'race-a' }),
    engine.process({ accountId: 'account-a', itemId: 'race', expectedVersion: 1, runId: 'race-b' }),
  ]);
  assert.equal(results.filter((entry) => entry.status === 'fulfilled').length, 1);
  assert.equal(results.filter((entry) => entry.status === 'rejected' && entry.reason.code === 'CAS_CONFLICT').length, 1);
});

test('work leases, retries, schedules, and publication keys are deterministic descriptors', () => {
  const store = new MemoryEditorialStore();
  const pause = createPauseController(store, () => NOW);
  pause.set({ paused: false, reason: 'TEST_ONLY', idempotencyKey: 'unpause-work-claim' });
  const key = workKey({ accountId: 'account-a', itemId: 'one', revision: 'r1', stage: 'fetched', policyBundleVersion: 'p1' });
  const claim = store.claimWork({ accountId: 'account-a', workKey: key, ownerToken: 'worker-a', now: NOW, leaseUntil: '2026-08-16T12:05:00.000Z' });
  assert.equal(claim.claimed, true);
  assert.equal(store.claimWork({ accountId: 'account-a', workKey: key, ownerToken: 'worker-b', now: NOW, leaseUntil: '2026-08-16T12:05:00.000Z' }).claimed, false);
  const retry = nextRetry({ workKey: key, attempt: 1, now: NOW, failure: classifyFailure(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })) });
  assert.equal(retry.eligible, true);
  assert.equal(nextRetry({ workKey: key, attempt: 1, now: NOW, failure: classifyFailure(Object.assign(new Error('rights'), { code: 'RIGHTS_DENIED' })) }).eligible, false);
  assert.deepEqual(ASSESSMENT_SCHEDULES.map((entry) => entry.cadence), ['PT15M', 'PT1H', 'P1D', 'P7D', 'P1M']);
  assert.ok(ASSESSMENT_SCHEDULES.every((entry) => ['assess_only', 'exceptions_only'].includes(entry.action)));
  assert.equal(publicationKey({ accountId: 'account-a', targetId: 'rss', itemId: 'one', revision: 'r1' }), publicationKey({ accountId: 'account-a', targetId: 'rss', itemId: 'one', revision: 'r1' }));
});
