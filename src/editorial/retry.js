import { sha256 } from './idempotency.js';

export const DEFAULT_RETRY_POLICIES = Object.freeze({
  acquisition: Object.freeze({ max_attempts: 3, base_delay_ms: 60_000, max_delay_ms: 15 * 60_000 }),
  evaluation: Object.freeze({ max_attempts: 2, base_delay_ms: 60_000, max_delay_ms: 5 * 60_000 }),
  projection: Object.freeze({ max_attempts: 5, base_delay_ms: 60_000, max_delay_ms: 60 * 60_000 }),
});

const PERMANENT_CODES = new Set([
  'RIGHTS_DENIED',
  'RIGHTS_UNKNOWN',
  'INVALID_INPUT',
  'POLICY_VERSION_STALE',
  'CALIBRATION_NOT_APPROVED',
  'AUTOMATED_PUBLICATION_DISABLED',
]);

export function classifyFailure(error) {
  const code = typeof error?.code === 'string' ? error.code : 'TRANSIENT_FAILURE';
  return Object.freeze({
    code,
    retryable: !PERMANENT_CODES.has(code),
    detail: typeof error?.message === 'string' ? error.message.slice(0, 240) : code,
  });
}

function deterministicJitter(workKey, attempt, base) {
  const unit = Number.parseInt(sha256(`${workKey}:${attempt}`).slice(0, 8), 16) / 0xffffffff;
  return Math.floor(base * 0.2 * unit);
}

export function nextRetry({ workKey, attempt, now, policy = DEFAULT_RETRY_POLICIES.evaluation, failure }) {
  if (!Number.isInteger(attempt) || attempt < 1) throw new TypeError('attempt must be a positive integer.');
  const nowMs = Date.parse(now);
  if (Number.isNaN(nowMs)) throw new TypeError('now must be an ISO date-time.');
  const classified = failure?.retryable === undefined ? classifyFailure(failure) : failure;
  if (!classified.retryable || attempt >= policy.max_attempts) {
    return Object.freeze({ eligible: false, exhausted: classified.retryable, next_attempt_at: null });
  }
  const base = Math.min(policy.max_delay_ms, policy.base_delay_ms * (2 ** (attempt - 1)));
  const delay = Math.min(policy.max_delay_ms, base + deterministicJitter(workKey, attempt, base));
  return Object.freeze({
    eligible: true,
    exhausted: false,
    delay_ms: delay,
    next_attempt_at: new Date(nowMs + delay).toISOString(),
  });
}

export function toDeadLetter({ accountId, workKey, itemId, stage, attempt, failure, now }) {
  return Object.freeze({
    id: `dead:${sha256({ accountId, workKey, itemId, stage })}`,
    account_id: accountId,
    work_key: workKey,
    item_id: itemId,
    stage,
    attempts: attempt,
    failure_code: classifyFailure(failure).code,
    created_at: now,
  });
}
