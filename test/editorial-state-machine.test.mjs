import assert from 'node:assert/strict';
import test from 'node:test';
import { sha256 } from '../src/editorial/idempotency.js';
import { assertTransitionAllowed } from '../src/editorial/states.js';
import { appendDecisionTrace, createDecisionTrace, verifyDecisionTrace } from '../src/editorial/trace.js';

function event(from, to, sequence = 1) {
  return {
    event_id: `event-${sequence}`,
    item_id: 'item-1',
    from_state: from,
    to_state: to,
    stage: from,
    verdict: to === 'held' ? 'hold' : 'allow',
    reason_codes: to === 'held' ? ['FAIL_CLOSED'] : [],
    policy_version: 'policy-1',
    input_hash: sha256({ sequence }),
    actor: 'system:test',
    run_id: 'run-1',
    created_at: `2026-08-16T12:00:0${sequence}.000Z`,
  };
}

test('editorial state machine permits the explicit path and rejects skips', () => {
  assert.equal(assertTransitionAllowed('fetched', 'rights_checked'), true);
  assert.equal(assertTransitionAllowed('verified', 'publishable'), true);
  assert.equal(assertTransitionAllowed('publishable', 'published'), true);
  assert.throws(() => assertTransitionAllowed('fetched', 'classified'), /not allowed/);
  assert.throws(() => assertTransitionAllowed('published', 'fetched'), /not allowed/);
  assert.equal(assertTransitionAllowed('held', 'fetched'), true);
});

test('decision trace is immutable, sequenced, and hash chained', () => {
  let trace = createDecisionTrace();
  trace = appendDecisionTrace(trace, event('fetched', 'rights_checked', 1));
  trace = appendDecisionTrace(trace, event('rights_checked', 'classified', 2));
  assert.equal(verifyDecisionTrace(trace), true);
  assert.equal(Object.isFrozen(trace), true);
  assert.equal(Object.isFrozen(trace.events[0]), true);
  assert.equal(trace.events[1].previous_hash, trace.events[0].event_hash);
  assert.throws(() => appendDecisionTrace(trace, { ...event('classified', 'summarized', 3), sequence: 9 }), /sequence/);

  const tampered = structuredClone(trace);
  tampered.events[0].verdict = 'hold';
  assert.throws(() => verifyDecisionTrace(tampered), /hash is invalid/);
});
