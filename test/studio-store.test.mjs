import assert from 'node:assert/strict';
import test from 'node:test';
import { accountScope } from '../apps/studio/src/authz.js';
import { MemoryStudioStore } from '../apps/studio/src/store.js';

const personalEditor = {
  subjectId: 'person-one',
  account: { type: 'personal', id: 'shared-name' },
  accountRoles: ['editor'],
  systemRoles: [],
};
const organizationEditor = {
  subjectId: 'person-two',
  account: { type: 'organization', id: 'shared-name' },
  accountRoles: ['account_admin'],
  systemRoles: [],
};
const operator = {
  subjectId: 'operator-one',
  account: { type: 'organization', id: 'operations' },
  accountRoles: ['viewer'],
  systemRoles: ['operator'],
};

function fixture() {
  let id = 0;
  return new MemoryStudioStore({
    now: () => '2026-08-16T12:00:00.000Z',
    idFactory: () => `audit-${++id}`,
  });
}

test('memory store defaults paused and only a system operator can change it', async () => {
  const store = fixture();
  assert.equal(await store.getGlobalPause(), true);
  await assert.rejects(
    store.setGlobalPause(false, { principal: personalEditor, idempotencyKey: 'pause-001' }),
    /system:pause/,
  );
  assert.deepEqual(await store.setGlobalPause(false, { principal: operator, idempotencyKey: 'pause-001' }), { paused: false });
  assert.equal(await store.getGlobalPause(), false);
});

test('personal and organization tuples stay isolated under concurrent writes', async () => {
  const store = fixture();
  const personal = accountScope(personalEditor);
  const organization = accountScope(organizationEditor);
  await Promise.all(Array.from({ length: 40 }, (_, index) => {
    const principal = index % 2 === 0 ? personalEditor : organizationEditor;
    const scope = index % 2 === 0 ? personal : organization;
    return store.put(
      scope,
      'source_settings',
      { id: `source-${index}`, watched: true },
      { principal, idempotencyKey: `source-${index}`, operation: 'source_settings.put' },
    );
  }));
  const personalRecords = await store.list(personal, 'source_settings');
  const organizationRecords = await store.list(organization, 'source_settings');
  assert.equal(personalRecords.length, 20);
  assert.equal(organizationRecords.length, 20);
  assert.ok(personalRecords.every((record) => Number(record.id.split('-')[1]) % 2 === 0));
  assert.ok(organizationRecords.every((record) => Number(record.id.split('-')[1]) % 2 === 1));
});

test('scoped idempotency replays identical input and rejects conflicting input', async () => {
  const store = fixture();
  const scope = accountScope(personalEditor);
  const context = { principal: personalEditor, idempotencyKey: 'source-replay', operation: 'source_settings.put' };
  const first = await store.put(scope, 'source_settings', { id: 'openalex', watched: true }, context);
  const replay = await store.put(scope, 'source_settings', { watched: true, id: 'openalex' }, context);
  assert.deepEqual(replay, first);
  await assert.rejects(
    store.put(scope, 'source_settings', { id: 'openalex', watched: false }, context),
    (error) => error.status === 409 && error.code === 'idempotency_conflict',
  );
  const audit = await store.listAudit(scope);
  assert.equal(audit.events.length, 1);
});

test('stored objects are cloned and audit output redacts credential references', async () => {
  const store = fixture();
  const scope = accountScope(personalEditor);
  const input = { id: 'openalex-one', credential_ref: 'vault://citewire/openalex/account-a' };
  const stored = await store.put(scope, 'connectors', input, {
    principal: personalEditor,
    idempotencyKey: 'connector-001',
    operation: 'connectors.configure',
  });
  stored.id = 'changed';
  assert.equal((await store.get(scope, 'connectors', 'openalex-one')).id, 'openalex-one');
  const audit = await store.listAudit(scope);
  const serialized = JSON.stringify(audit);
  assert.match(serialized, /vault:\/\/\[redacted\]/);
  assert.doesNotMatch(serialized, /account-a/);
});

test('exception transitions are limited, idempotent, and audited', async () => {
  const store = fixture();
  const scope = accountScope(personalEditor);
  await store.put(scope, 'exceptions', { id: 'held-one', reason_code: 'RIGHTS_NOT_CLEARED', state: 'open' }, {
    principal: personalEditor,
    idempotencyKey: 'exception-seed',
    operation: 'exceptions.seed',
  });
  const context = { principal: personalEditor, idempotencyKey: 'exception-hold', operation: 'exceptions.transition' };
  const held = await store.transitionException(scope, 'held-one', 'hold', context);
  assert.equal(held.state, 'held');
  assert.deepEqual(await store.transitionException(scope, 'held-one', 'hold', context), held);
  await assert.rejects(
    store.transitionException(scope, 'held-one', 'publish', { ...context, idempotencyKey: 'exception-publish' }),
    /not allowed/,
  );
});
