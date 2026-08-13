// Process-local arXiv request gate. arXiv calls share this module singleton, so
// separately constructed tools in one Node process cannot start requests in
// parallel or less than three seconds apart. Multi-process deployments need a
// shared, deployment-level limiter in addition to this local gate.

export const ARXIV_MIN_START_INTERVAL_MS = 3000;

const productionScheduler = Object.freeze({
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
});

let scheduler = productionScheduler;
let tail = Promise.resolve();
let nextStartAt = 0;

// Queue a request-starting operation. The queue is deliberately held until
// operation settles: this is both a single-concurrency gate and start-time
// limiter. A rejection is absorbed by the queue tail, so later calls continue.
export function scheduleArxivRequest(operation) {
  const run = async () => {
    const now = scheduler.now();
    const delay = Math.max(0, nextStartAt - now);
    if (delay > 0) await scheduler.sleep(delay);

    const startedAt = scheduler.now();
    nextStartAt = startedAt + ARXIV_MIN_START_INTERVAL_MS;
    return operation();
  };

  const result = tail.then(run, run);
  tail = result.catch(() => undefined);
  return result;
}

// Test-only reset point. It is not part of the provider configuration, keeping
// production behavior process-wide even when tools are constructed separately.
export function resetArxivRequestSchedulerForTest(nextScheduler = productionScheduler) {
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
