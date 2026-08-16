import { requestFingerprint } from './idempotency.js';

export function createPauseController(store, now = () => new Date().toISOString()) {
  if (!store?.getPauseState || !store?.setPauseState) {
    throw new TypeError('Pause controller requires an injected pause store.');
  }
  return Object.freeze({
    get() {
      return store.getPauseState();
    },
    set({ paused, reason, idempotencyKey }) {
      return store.setPauseState({
        paused,
        reason,
        idempotencyKey,
        fingerprint: requestFingerprint({ paused, reason }),
        now: now(),
      });
    },
    assertUnpaused() {
      if (store.getPauseState().paused) {
        const error = new Error('GLOBAL_PAUSE_ACTIVE');
        error.code = 'GLOBAL_PAUSE_ACTIVE';
        throw error;
      }
      return true;
    },
  });
}
