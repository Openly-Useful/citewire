import assert from 'node:assert/strict';
import test from 'node:test';
import { publicationKey } from '../src/editorial/idempotency.js';
import { MemoryEditorialStore } from '../src/editorial/memory-store.js';
import { createPauseController } from '../src/editorial/pause.js';

test('publication reservation is account-scoped and prevents double recording', () => {
  const store = new MemoryEditorialStore();
  const pause = createPauseController(store);
  pause.set({ paused: false, reason: 'TEST_ONLY', idempotencyKey: 'unpause-publication' });
  const key = publicationKey({ accountId: 'account-a', targetId: 'rss-preview', itemId: 'item-1', revision: 'rev-1' });
  const first = store.reservePublication({ accountId: 'account-a', publicationKey: key, itemId: 'item-1', revision: 'rev-1' });
  const race = store.reservePublication({ accountId: 'account-a', publicationKey: key, itemId: 'item-1', revision: 'rev-1' });
  assert.equal(first.reserved, true);
  assert.equal(race.reserved, false);
  const recorded = store.recordPublicationReceipt({ accountId: 'account-a', publicationKey: key, receipt: { id: 'receipt-1' } });
  const replay = store.recordPublicationReceipt({ accountId: 'account-a', publicationKey: key, receipt: { id: 'receipt-2' } });
  assert.deepEqual(replay, recorded);
  assert.deepEqual(store.findPublicationReceipt('account-a', key), { id: 'receipt-1' });
  assert.equal(store.findPublicationReceipt('account-b', key), null);
});

test('reference store enforces account isolation for items and dead letters', () => {
  const store = new MemoryEditorialStore();
  store.createItem({ accountId: 'account-a', item: { id: 'one', revision: 'r1', state: 'fetched' } });
  assert.equal(store.getItem('account-b', 'one'), null);
  assert.equal(store.listItems('account-b').length, 0);
  assert.equal(store.listDeadLetters('account-b').length, 0);
});
