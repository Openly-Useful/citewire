import assert from 'node:assert/strict';
import test from 'node:test';
import { tools as arxivTools } from '../src/providers/arxiv.js';
import {
  ARXIV_MIN_START_INTERVAL_MS,
  resetArxivRequestSchedulerForTest,
} from '../src/providers/arxiv-limiter.js';

const EMPTY_FEED = '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>';

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

function response(body = EMPTY_FEED) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () => body,
  };
}

test('arXiv tools share a process queue with concurrency 1 and 3000ms start spacing', async () => {
  const scheduler = fakeScheduler(1000);
  resetArxivRequestSchedulerForTest(scheduler);
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
    const first = arxivTools({ fetch: firstFetch })[0].handler({ query: 'first' });
    const second = arxivTools({ fetch: secondFetch })[0].handler({ query: 'second' });
    await Promise.resolve();
    await Promise.resolve();
    assert.deepEqual(starts, [1000]);

    releaseFirst();
    await Promise.all([first, second]);

    assert.equal(maxActive, 1);
    assert.deepEqual(starts, [1000, 4000]);
    assert.deepEqual(scheduler.sleeps, [ARXIV_MIN_START_INTERVAL_MS]);
  } finally {
    resetArxivRequestSchedulerForTest();
  }
});

test('a failed arXiv request releases the shared queue without a real sleep', async () => {
  const scheduler = fakeScheduler(5000);
  resetArxivRequestSchedulerForTest(scheduler);
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
    const failed = arxivTools({ fetch: failedFetch })[0].handler({ query: 'failed' });
    const successful = arxivTools({ fetch: successfulFetch })[0].handler({ query: 'next' });
    const outcomes = await Promise.allSettled([failed, successful]);

    assert.equal(outcomes[0].status, 'rejected');
    assert.equal(outcomes[1].status, 'fulfilled');
    assert.deepEqual(starts, [5000, 8000]);
    assert.deepEqual(scheduler.sleeps, [ARXIV_MIN_START_INTERVAL_MS]);
  } finally {
    resetArxivRequestSchedulerForTest();
  }
});
