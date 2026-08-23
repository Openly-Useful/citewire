import { createHash, randomUUID } from 'node:crypto';
import { assertNoCredentialMaterial } from '../../../src/security/credential-references.js';
import { redactForOutput } from '../../../src/security/redaction.js';
import { accountScope, requireCapability, scopeKey, validatePrincipal } from './authz.js';
import { transitionException, validateException } from './exceptions.js';

const COLLECTIONS = new Set(['source_settings', 'connectors', 'exceptions']);

export class StudioConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StudioConflictError';
    this.status = 409;
    this.code = 'idempotency_conflict';
  }
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(operation, input) {
  return createHash('sha256').update(canonicalJson({ operation, input })).digest('hex');
}

function ensureCollection(collection) {
  if (!COLLECTIONS.has(collection)) throw new TypeError(`Unknown Studio collection: ${String(collection)}`);
}

function ensureRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new TypeError('Studio record must be an object.');
  if (typeof record.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(record.id)) {
    throw new TypeError('Studio record id is invalid.');
  }
  assertNoCredentialMaterial(record);
  return structuredClone(record);
}

function ensureMutation(scope, context, operation, input) {
  if (!context || typeof context !== 'object') throw new TypeError('Mutation context is required.');
  const principal = validatePrincipal(context.principal);
  if (scopeKey(accountScope(principal)) !== scopeKey(scope)) throw new TypeError('Mutation scope must match the trusted principal.');
  if (typeof context.idempotencyKey !== 'string' || !/^[A-Za-z0-9._:-]{3,128}$/.test(context.idempotencyKey)) {
    throw new TypeError('A bounded idempotency key is required.');
  }
  return {
    principal,
    operation,
    idempotencyKey: context.idempotencyKey,
    inputFingerprint: fingerprint(operation, input),
  };
}

export class MemoryStudioStore {
  #accounts = new Map();
  #globalPaused;
  #idempotency = new Map();
  #locks = new Map();
  #now;
  #idFactory;

  constructor({ now = () => new Date().toISOString(), idFactory = randomUUID, initiallyPaused = true } = {}) {
    if (typeof initiallyPaused !== 'boolean') throw new TypeError('initiallyPaused must be boolean.');
    this.#now = now;
    this.#idFactory = idFactory;
    this.#globalPaused = initiallyPaused;
  }

  #account(scope) {
    const key = scopeKey(scope);
    if (!this.#accounts.has(key)) {
      this.#accounts.set(key, {
        source_settings: new Map(),
        connectors: new Map(),
        exceptions: new Map(),
        audit: [],
      });
    }
    return this.#accounts.get(key);
  }

  async #withLock(key, action) {
    const previous = this.#locks.get(key) ?? Promise.resolve();
    const run = previous.then(action, action);
    const tail = run.catch(() => undefined);
    this.#locks.set(key, tail);
    try {
      return await run;
    } finally {
      if (this.#locks.get(key) === tail) this.#locks.delete(key);
    }
  }

  #audit(account, scope, principal, action, target, details) {
    const event = Object.freeze({
      id: this.#idFactory(),
      occurred_at: this.#now(),
      scope: structuredClone(scope),
      actor_subject_id: principal.subjectId,
      action,
      target,
      details: redactForOutput(details),
    });
    account.audit.push(event);
    return event;
  }

  async list(scope, collection) {
    ensureCollection(collection);
    return [...this.#account(scope)[collection].values()].map((record) => structuredClone(record));
  }

  async get(scope, collection, id) {
    ensureCollection(collection);
    const record = this.#account(scope)[collection].get(id);
    return record ? structuredClone(record) : null;
  }

  async listAudit(scope, { cursor = 0, limit = 100 } = {}) {
    if (!Number.isInteger(cursor) || cursor < 0) throw new TypeError('Audit cursor is invalid.');
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw new TypeError('Audit limit is invalid.');
    const audit = this.#account(scope).audit;
    return {
      events: audit.slice(cursor, cursor + limit).map((event) => structuredClone(event)),
      next_cursor: cursor + limit < audit.length ? cursor + limit : null,
    };
  }

  async put(scope, collection, record, context) {
    ensureCollection(collection);
    requireCapability(context?.principal, 'account:write');
    const safe = collection === 'exceptions' ? validateException(ensureRecord(record)) : ensureRecord(record);
    const operation = context.operation ?? `${collection}.put`;
    const mutation = ensureMutation(scope, context, operation, safe);
    const lockKey = scopeKey(scope);
    return this.#withLock(lockKey, async () => {
      const idempotencyKey = `${lockKey}:${operation}:${mutation.idempotencyKey}`;
      const replay = this.#idempotency.get(idempotencyKey);
      if (replay) {
        if (replay.inputFingerprint !== mutation.inputFingerprint) {
          throw new StudioConflictError('The idempotency key was already used with different input.');
        }
        return structuredClone(replay.result);
      }
      const account = this.#account(scope);
      account[collection].set(safe.id, structuredClone(safe));
      this.#audit(account, scope, mutation.principal, operation, `${collection}:${safe.id}`, safe);
      this.#idempotency.set(idempotencyKey, { inputFingerprint: mutation.inputFingerprint, result: safe });
      return structuredClone(safe);
    });
  }

  async transitionException(scope, id, action, context) {
    requireCapability(context?.principal, 'account:write');
    const operation = 'exceptions.transition';
    const mutation = ensureMutation(scope, context, operation, { id, action });
    const lockKey = scopeKey(scope);
    return this.#withLock(lockKey, async () => {
      const idempotencyKey = `${lockKey}:${operation}:${mutation.idempotencyKey}`;
      const replay = this.#idempotency.get(idempotencyKey);
      if (replay) {
        if (replay.inputFingerprint !== mutation.inputFingerprint) throw new StudioConflictError('The idempotency key was already used with different input.');
        return structuredClone(replay.result);
      }
      const account = this.#account(scope);
      const current = account.exceptions.get(id);
      if (!current) throw new TypeError('Exception was not found.');
      const next = transitionException(current, action, this.#now());
      account.exceptions.set(id, next);
      this.#audit(account, scope, mutation.principal, operation, `exceptions:${id}`, { action, state: next.state });
      this.#idempotency.set(idempotencyKey, { inputFingerprint: mutation.inputFingerprint, result: next });
      return structuredClone(next);
    });
  }

  async getGlobalPause() {
    return this.#globalPaused;
  }

  async setGlobalPause(paused, context) {
    if (typeof paused !== 'boolean') throw new TypeError('paused must be boolean.');
    const principal = requireCapability(context?.principal, 'system:pause');
    if (typeof context?.idempotencyKey !== 'string' || !/^[A-Za-z0-9._:-]{3,128}$/.test(context.idempotencyKey)) {
      throw new TypeError('A bounded idempotency key is required.');
    }
    const operation = 'system.global_pause';
    const inputFingerprint = fingerprint(operation, { paused });
    return this.#withLock('system:global', async () => {
      const idempotencyKey = `system:${operation}:${context.idempotencyKey}`;
      const replay = this.#idempotency.get(idempotencyKey);
      if (replay) {
        if (replay.inputFingerprint !== inputFingerprint) throw new StudioConflictError('The idempotency key was already used with different input.');
        return structuredClone(replay.result);
      }
      this.#globalPaused = paused;
      const result = { paused: this.#globalPaused };
      const scope = accountScope(principal);
      const account = this.#account(scope);
      this.#audit(account, { type: 'system', id: 'global' }, principal, operation, 'system:global_pause', result);
      this.#idempotency.set(idempotencyKey, { inputFingerprint, result });
      return structuredClone(result);
    });
  }
}
