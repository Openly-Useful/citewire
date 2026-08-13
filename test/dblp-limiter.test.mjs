import assert from 'node:assert/strict';
import test from 'node:test';
import { tools as dblpTools } from '../src/providers/dblp.js';
import {
  DBLP_MIN_START_INTERVAL_MS,
  resetDblpRequestSchedulerForTest,
} from '../src/providers/dblp-limiter.js';

function fakeScheduler(startAt) {
  let now = startAt;
  const sleeps = [];
  return {
    now: () => now,
    sleep: async (ms) => {
      sleeps.push(ms);
      now += ms;
    },
    sleeps,
  };
}

function response() {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () => JSON.stringify({ result: { hits: { hit: [] } } }),
  };
}

test('dblp tools share process-local concurrency 1 and 1000ms start spacing', async () => {
  const scheduler = fakeScheduler(2000);
  resetDblpRequestSchedulerForTest(scheduler);
  const starts = [];
  let active = 0;
  let maxActive = 0;
  let releaseFirst;
  const firstPending = new Promise((resolve) => {
    releaseFirst = resolve;
  });

  const firstFetch = async () => {
    starts.push(scheduler.now());
    active += 1;
    maxActive = Math.max(maxActive, active);
    await firstPending;
    active -= 1;
    return response();
  };
  const secondFetch = async () => {
    starts.push(scheduler.now());
    active += 1;
    maxActive = Math.max(maxActive, active);
    active -= 1;
    return response();
  };

  try {
    const first = dblpTools({ fetch: firstFetch })[0].handler({ query: 'first' });
    const second = dblpTools({ fetch: secondFetch })[0].handler({ query: 'second' });
    await Promise.resolve();
    await Promise.resolve();
    assert.deepEqual(starts, [2000]);

    releaseFirst();
    await Promise.all([first, second]);

    assert.equal(maxActive, 1);
    assert.deepEqual(starts, [2000, 3000]);
    assert.deepEqual(scheduler.sleeps, [DBLP_MIN_START_INTERVAL_MS]);
  } finally {
    resetDblpRequestSchedulerForTest();
  }
});

test('a failed dblp request releases the queue without sleeping in real time', async () => {
  const scheduler = fakeScheduler(6000);
  resetDblpRequestSchedulerForTest(scheduler);
  const starts = [];
  const failedFetch = async () => {
    starts.push(scheduler.now());
    throw new Error('deterministic failure');
  };
  const successfulFetch = async () => {
    starts.push(scheduler.now());
    return response();
  };

  try {
    const failed = dblpTools({ fetch: failedFetch })[0].handler({ query: 'failed' });
    const successful = dblpTools({ fetch: successfulFetch })[0].handler({ query: 'next' });
    const outcomes = await Promise.allSettled([failed, successful]);

    assert.equal(outcomes[0].status, 'rejected');
    assert.equal(outcomes[1].status, 'fulfilled');
    assert.deepEqual(starts, [6000, 7000]);
    assert.deepEqual(scheduler.sleeps, [DBLP_MIN_START_INTERVAL_MS]);
  } finally {
    resetDblpRequestSchedulerForTest();
  }
});
