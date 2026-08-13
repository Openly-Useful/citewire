// Process-local dblp request gate. dblp recommends waiting at least one or two
// seconds between consecutive API requests. This module enforces the lower
// bound and single concurrency within one Node process. Multi-process and
// horizontally scaled deployments still need a shared deployment-level gate.

export const DBLP_MIN_START_INTERVAL_MS = 1000;

const productionScheduler = Object.freeze({
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
});

let scheduler = productionScheduler;
let tail = Promise.resolve();
let nextStartAt = 0;

export function scheduleDblpRequest(operation) {
  const run = async () => {
    const delay = Math.max(0, nextStartAt - scheduler.now());
    if (delay > 0) await scheduler.sleep(delay);

    const startedAt = scheduler.now();
    nextStartAt = startedAt + DBLP_MIN_START_INTERVAL_MS;
    return operation();
  };

  const result = tail.then(run, run);
  tail = result.catch(() => undefined);
  return result;
}

export function resetDblpRequestSchedulerForTest(nextScheduler = productionScheduler) {
  if (
    !nextScheduler ||
    typeof nextScheduler.now !== 'function' ||
    typeof nextScheduler.sleep !== 'function'
  ) {
    throw new TypeError('scheduler must provide now() and sleep(ms)');
  }
  scheduler = nextScheduler;
  tail = Promise.resolve();
  nextStartAt = 0;
}
