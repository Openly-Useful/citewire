import { requestFingerprint } from './idempotency.js';
import { appendDecisionTrace, createDecisionTrace } from './trace.js';
import { assertTransitionAllowed, isEditorialState } from './states.js';

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function account(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{2,80}$/.test(value)) {
    throw new TypeError('A valid accountId is required.');
  }
  return value;
}

function id(value, name) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${name} is required.`);
  return value;
}

function asTime(value, name) {
  const time = Date.parse(value);
  if (Number.isNaN(time)) throw new TypeError(`${name} must be an ISO date-time.`);
  return time;
}

function assertSafeRecord(value, path = 'record') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertSafeRecord(entry, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (/password|token|secret|api[_-]?key|credential[_-]?ref|full[_-]?text|raw[_-]?text|article[_-]?body/i.test(key) || key.toLowerCase() === 'body') {
      throw new TypeError(`${path} contains a prohibited secret or source-content field.`);
    }
    assertSafeRecord(child, `${path}.${key}`);
  }
}

export class MemoryEditorialStore {
  #accounts = new Map();
  #idempotency = new Map();
  #pause = { paused: true, reason: 'SAFE_DEFAULT', version: 1, updated_at: null };
  #work = new Map();
  #publications = new Map();

  #scope(accountId) {
    const key = account(accountId);
    if (!this.#accounts.has(key)) {
      this.#accounts.set(key, {
        items: new Map(),
        traces: new Map(),
        exceptions: new Map(),
        dead_letters: new Map(),
      });
    }
    return this.#accounts.get(key);
  }

  createItem({ accountId, item }) {
    const scoped = this.#scope(accountId);
    const itemId = id(item?.id, 'item.id');
    if (scoped.items.has(itemId)) throw new TypeError(`Item already exists: ${itemId}`);
    if (item.state !== 'fetched') throw new TypeError('New editorial items must start in fetched.');
    id(item.revision, 'item.revision');
    assertSafeRecord(item, 'item');
    const stored = clone({ ...item, version: 1 });
    scoped.items.set(itemId, stored);
    scoped.traces.set(itemId, createDecisionTrace());
    return clone(stored);
  }

  getItem(accountId, itemId) {
    return clone(this.#scope(accountId).items.get(id(itemId, 'itemId')) ?? null);
  }

  listItems(accountId) {
    return [...this.#scope(accountId).items.values()].map(clone);
  }

  getTrace(accountId, itemId) {
    const trace = this.#scope(accountId).traces.get(id(itemId, 'itemId'));
    return clone(trace ?? createDecisionTrace());
  }

  advance({ accountId, itemId, expectedVersion, nextState, decisionEvent }) {
    const scoped = this.#scope(accountId);
    const key = id(itemId, 'itemId');
    const current = scoped.items.get(key);
    if (!current) throw new TypeError(`Unknown editorial item: ${key}`);
    if (current.version !== expectedVersion) {
      const error = new Error('CAS_CONFLICT');
      error.code = 'CAS_CONFLICT';
      throw error;
    }
    if (!isEditorialState(nextState)) throw new TypeError(`Unknown editorial state: ${String(nextState)}`);
    assertTransitionAllowed(current.state, nextState);
    if (decisionEvent.from_state !== current.state || decisionEvent.to_state !== nextState) {
      throw new TypeError('Decision event transition does not match the requested state advance.');
    }
    const nextTrace = appendDecisionTrace(scoped.traces.get(key), decisionEvent);
    const next = clone({ ...current, state: nextState, version: current.version + 1 });
    scoped.traces.set(key, nextTrace);
    scoped.items.set(key, next);
    return { item: clone(next), trace: clone(nextTrace) };
  }

  addException(accountId, exception) {
    const scoped = this.#scope(accountId);
    const exceptionId = id(exception?.id, 'exception.id');
    assertSafeRecord(exception, 'exception');
    if (scoped.exceptions.has(exceptionId)) return clone(scoped.exceptions.get(exceptionId));
    scoped.exceptions.set(exceptionId, clone(exception));
    return clone(exception);
  }

  listExceptions(accountId, itemId) {
    return [...this.#scope(accountId).exceptions.values()]
      .filter((entry) => !itemId || entry.item_id === itemId)
      .map(clone);
  }

  getPauseState() {
    return clone(this.#pause);
  }

  setPauseState({ paused, reason, idempotencyKey, fingerprint, now }) {
    if (typeof paused !== 'boolean') throw new TypeError('paused must be a boolean.');
    const idem = idempotencyKey ? `pause:${idempotencyKey}` : null;
    const bodyFingerprint = fingerprint ?? requestFingerprint({ paused, reason });
    if (idem && this.#idempotency.has(idem)) {
      const prior = this.#idempotency.get(idem);
      if (prior.fingerprint !== bodyFingerprint) {
        const error = new Error('IDEMPOTENCY_CONFLICT');
        error.code = 'IDEMPOTENCY_CONFLICT';
        throw error;
      }
      return clone(prior.result);
    }
    this.#pause = {
      paused,
      reason: typeof reason === 'string' && reason ? reason : paused ? 'OPERATOR_PAUSE' : 'OPERATOR_RESUME',
      version: this.#pause.version + 1,
      updated_at: now ?? null,
    };
    if (idem) this.#idempotency.set(idem, { fingerprint: bodyFingerprint, result: clone(this.#pause) });
    return clone(this.#pause);
  }

  claimWork({ accountId, workKey, ownerToken, now, leaseUntil }) {
    const scope = account(accountId);
    const key = `${scope}:${id(workKey, 'workKey')}`;
    id(ownerToken, 'ownerToken');
    const nowMs = asTime(now, 'now');
    const leaseMs = asTime(leaseUntil, 'leaseUntil');
    if (leaseMs <= nowMs) throw new TypeError('leaseUntil must be after now.');
    if (this.#pause.paused) return clone({ claimed: false, reason: 'GLOBAL_PAUSE_ACTIVE', work: null });
    const existing = this.#work.get(key);
    if (existing?.status === 'completed') return clone({ claimed: false, work: existing });
    if (existing?.status === 'claimed' && Date.parse(existing.lease_until) > nowMs) {
      return clone({ claimed: false, work: existing });
    }
    const work = {
      account_id: scope,
      work_key: workKey,
      owner_token: ownerToken,
      status: 'claimed',
      attempt: (existing?.attempt ?? 0) + 1,
      lease_until: new Date(leaseMs).toISOString(),
    };
    this.#work.set(key, work);
    return clone({ claimed: true, work });
  }

  completeWork({ accountId, workKey, ownerToken, resultRef }) {
    const key = `${account(accountId)}:${id(workKey, 'workKey')}`;
    const work = this.#work.get(key);
    if (!work || work.status !== 'claimed' || work.owner_token !== ownerToken) throw new Error('WORK_OWNERSHIP_CONFLICT');
    const complete = { ...work, status: 'completed', result_ref: resultRef ?? null };
    this.#work.set(key, complete);
    return clone(complete);
  }

  failWork({ accountId, workKey, ownerToken, failure, retry }) {
    const key = `${account(accountId)}:${id(workKey, 'workKey')}`;
    const work = this.#work.get(key);
    if (!work || work.status !== 'claimed' || work.owner_token !== ownerToken) throw new Error('WORK_OWNERSHIP_CONFLICT');
    const failed = { ...work, status: retry?.eligible ? 'retry_wait' : 'dead_lettered', failure: clone(failure), retry: clone(retry) };
    this.#work.set(key, failed);
    if (!retry?.eligible) this.#scope(accountId).dead_letters.set(workKey, failed);
    return clone(failed);
  }

  listDeadLetters(accountId) {
    return [...this.#scope(accountId).dead_letters.values()].map(clone);
  }

  reservePublication({ accountId, publicationKey, itemId, revision }) {
    if (this.#pause.paused) throw new Error('GLOBAL_PAUSE_ACTIVE');
    const key = `${account(accountId)}:${id(publicationKey, 'publicationKey')}`;
    const existing = this.#publications.get(key);
    if (existing) return clone({ reserved: false, reservation: existing });
    const reservation = {
      account_id: accountId,
      publication_key: publicationKey,
      item_id: id(itemId, 'itemId'),
      revision: id(revision, 'revision'),
      status: 'reserved',
      receipt: null,
    };
    this.#publications.set(key, reservation);
    return clone({ reserved: true, reservation });
  }

  recordPublicationReceipt({ accountId, publicationKey, receipt }) {
    const key = `${account(accountId)}:${id(publicationKey, 'publicationKey')}`;
    const reservation = this.#publications.get(key);
    if (!reservation) throw new Error('PUBLICATION_NOT_RESERVED');
    if (reservation.receipt) return clone(reservation);
    assertSafeRecord(receipt, 'receipt');
    const delivered = { ...reservation, status: 'recorded', receipt: clone(receipt) };
    this.#publications.set(key, delivered);
    return clone(delivered);
  }

  findPublicationReceipt(accountId, publicationKey) {
    return clone(this.#publications.get(`${account(accountId)}:${id(publicationKey, 'publicationKey')}`)?.receipt ?? null);
  }
}
