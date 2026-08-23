const ACTIONS = Object.freeze({
  open: new Set(['acknowledge', 'hold', 'dismiss']),
  acknowledged: new Set(['hold', 'dismiss']),
  held: new Set(['acknowledge', 'dismiss']),
  dismissed: new Set(),
});

export function transitionException(record, action, now) {
  if (!record || typeof record !== 'object' || !ACTIONS[record.state]) throw new TypeError('Exception state is invalid.');
  if (!ACTIONS[record.state].has(action)) throw new TypeError(`Exception action ${String(action)} is not allowed from ${record.state}.`);
  const state = action === 'acknowledge' ? 'acknowledged' : action === 'hold' ? 'held' : 'dismissed';
  return structuredClone({ ...record, state, updated_at: now });
}

export function validateException(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new TypeError('Exception must be an object.');
  if (typeof record.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(record.id)) throw new TypeError('Exception id is invalid.');
  if (typeof record.reason_code !== 'string' || !/^[A-Z][A-Z0-9_]{2,79}$/.test(record.reason_code)) throw new TypeError('Exception reason_code is invalid.');
  if (!ACTIONS[record.state]) throw new TypeError('Exception state is invalid.');
  return structuredClone(record);
}
