export const EDITORIAL_STATES = Object.freeze([
  'fetched',
  'rights_checked',
  'classified',
  'summarized',
  'verified',
  'publishable',
  'published',
  'held',
]);

const TRANSITIONS = Object.freeze({
  fetched: new Set(['rights_checked', 'held']),
  rights_checked: new Set(['classified', 'held']),
  classified: new Set(['summarized', 'held']),
  summarized: new Set(['verified', 'held']),
  verified: new Set(['publishable', 'held']),
  publishable: new Set(['published', 'held']),
  published: new Set(),
  held: new Set(['fetched', 'rights_checked', 'classified', 'summarized', 'verified']),
});

export function isEditorialState(value) {
  return EDITORIAL_STATES.includes(value);
}

export function assertTransitionAllowed(from, to) {
  if (!isEditorialState(from) || !isEditorialState(to)) {
    throw new TypeError(`Unknown editorial transition: ${String(from)} -> ${String(to)}`);
  }
  if (!TRANSITIONS[from].has(to)) {
    throw new TypeError(`Editorial transition is not allowed: ${from} -> ${to}`);
  }
  return true;
}

export function nextHappyState(state) {
  return {
    fetched: 'rights_checked',
    rights_checked: 'classified',
    classified: 'summarized',
    summarized: 'verified',
    verified: 'publishable',
    publishable: 'published',
  }[state] ?? null;
}

export function isTerminalEditorialState(state) {
  if (!isEditorialState(state)) throw new TypeError(`Unknown editorial state: ${String(state)}`);
  return state === 'published' || state === 'held';
}
