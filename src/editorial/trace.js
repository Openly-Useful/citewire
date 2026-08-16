import { sha256, stableJson } from './idempotency.js';
import { assertTransitionAllowed } from './states.js';

const ZERO_HASH = '0'.repeat(64);

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function text(value, name) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${name} is required.`);
  return value;
}

function safeReasons(value) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !/^[A-Z0-9_]+$/.test(entry))) {
    throw new TypeError('reason_codes must contain stable uppercase codes.');
  }
  return [...value];
}

function eventMaterial(input) {
  const material = {
    event_id: text(input.event_id, 'event_id'),
    sequence: input.sequence,
    previous_hash: input.previous_hash,
    item_id: text(input.item_id, 'item_id'),
    from_state: text(input.from_state, 'from_state'),
    to_state: text(input.to_state, 'to_state'),
    stage: text(input.stage, 'stage'),
    verdict: text(input.verdict, 'verdict'),
    reason_codes: safeReasons(input.reason_codes ?? []),
    policy_version: text(input.policy_version, 'policy_version'),
    model_version: input.model_version ?? null,
    input_hash: text(input.input_hash, 'input_hash'),
    actor: text(input.actor, 'actor'),
    run_id: text(input.run_id, 'run_id'),
    created_at: text(input.created_at, 'created_at'),
  };
  if (!Number.isInteger(material.sequence) || material.sequence < 1) throw new TypeError('sequence must be a positive integer.');
  if (!/^[a-f0-9]{64}$/.test(material.previous_hash)) throw new TypeError('previous_hash must be a SHA-256 hash.');
  if (!/^[a-f0-9]{64}$/.test(material.input_hash)) throw new TypeError('input_hash must be a SHA-256 hash.');
  if (Number.isNaN(Date.parse(material.created_at))) throw new TypeError('created_at must be an ISO date-time.');
  assertTransitionAllowed(material.from_state, material.to_state);
  return material;
}

export function createDecisionEvent(input) {
  const material = eventMaterial(input);
  return deepFreeze({ ...material, event_hash: sha256(stableJson(material)) });
}

export function createDecisionTrace(events = []) {
  let trace = deepFreeze({ events: [], head_hash: ZERO_HASH });
  for (const event of events) trace = appendDecisionTrace(trace, event);
  return trace;
}

export function appendDecisionTrace(trace, input) {
  verifyDecisionTrace(trace);
  const expectedSequence = trace.events.length + 1;
  const event = createDecisionEvent({
    ...input,
    sequence: input.sequence ?? expectedSequence,
    previous_hash: input.previous_hash ?? trace.head_hash,
  });
  if (event.sequence !== expectedSequence || event.previous_hash !== trace.head_hash) {
    throw new TypeError('Decision trace sequence or previous hash does not match the immutable head.');
  }
  return deepFreeze({ events: [...trace.events, event], head_hash: event.event_hash });
}

export function verifyDecisionTrace(trace) {
  if (!trace || !Array.isArray(trace.events) || typeof trace.head_hash !== 'string') {
    throw new TypeError('Decision trace is malformed.');
  }
  let previous = ZERO_HASH;
  for (let index = 0; index < trace.events.length; index += 1) {
    const event = trace.events[index];
    if (event.sequence !== index + 1 || event.previous_hash !== previous) {
      throw new TypeError('Decision trace chain is broken.');
    }
    const { event_hash, ...material } = event;
    if (event_hash !== sha256(stableJson(material))) throw new TypeError('Decision trace event hash is invalid.');
    previous = event_hash;
  }
  if (trace.head_hash !== previous) throw new TypeError('Decision trace head hash is invalid.');
  return true;
}
