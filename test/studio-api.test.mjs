import assert from 'node:assert/strict';
import test from 'node:test';
import { createStudioApi, MemoryStudioStore } from '../apps/studio/src/index.js';
import { accountScope } from '../apps/studio/src/authz.js';
import { loadDefaultRegistry } from '../src/community/registry.js';

const viewer = {
  subjectId: 'viewer-one',
  account: { type: 'organization', id: 'account-a' },
  accountRoles: ['viewer'],
  systemRoles: [],
};
const editor = {
  subjectId: 'editor-one',
  account: { type: 'organization', id: 'account-a' },
  accountRoles: ['editor'],
  systemRoles: [],
};
const otherEditor = {
  subjectId: 'editor-two',
  account: { type: 'organization', id: 'account-b' },
  accountRoles: ['editor'],
  systemRoles: [],
};
const operator = {
  subjectId: 'operator-one',
  account: { type: 'organization', id: 'operations' },
  accountRoles: ['viewer'],
  systemRoles: ['operator'],
};

function setup() {
  let id = 0;
  const store = new MemoryStudioStore({ now: () => '2026-08-16T12:00:00.000Z', idFactory: () => `audit-${++id}` });
  const api = createStudioApi({ store, sourceRegistry: loadDefaultRegistry() });
  return { store, api };
}

test('Studio health is local, paused, and exposes no activation or publishing', async () => {
  const { api } = setup();
  assert.deepEqual((await api.handle({ path: '/v1/studio/health' })).body, {
    ok: true,
    paused: true,
    external_calls: false,
    connector_activation: 'disabled',
    publishing: 'unavailable',
  });
  assert.equal((await api.handle({ path: '/v1/studio/overview' })).status, 401);
});

test('session scope comes only from the trusted principal and account override is rejected', async () => {
  const { api } = setup();
  const session = await api.handle({ path: '/v1/studio/session', principal: editor });
  assert.deepEqual(session.body.account, { type: 'organization', id: 'account-a' });
  assert.deepEqual(session.body.capabilities, ['account:read', 'account:write']);
  const override = await api.handle({
    method: 'PUT',
    path: '/v1/studio/connectors/openalex-one',
    principal: editor,
    idempotencyKey: 'connector-override',
    body: { source_id: 'openalex', access_mode: 'public', accountId: 'account-b' },
  });
  assert.equal(override.status, 400);
  assert.match(override.body.detail, /cannot override/);
});

test('connector configurations are endpointless, disabled, account-scoped, and fully redacted', async () => {
  const { api } = setup();
  const saved = await api.handle({
    method: 'PUT',
    path: '/v1/studio/connectors/openalex-one',
    principal: editor,
    idempotencyKey: 'connector-001',
    body: {
      source_id: 'openalex',
      access_mode: 'organization_credential',
      credential_ref: 'vault://citewire/openalex/account-a',
    },
  });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.activation_state, 'disabled');
  assert.equal(saved.body.external_calls, false);
  assert.equal(saved.body.credential_ref, 'vault://[redacted]');
  assert.doesNotMatch(JSON.stringify(saved), /account-a/);

  const own = await api.handle({ path: '/v1/studio/connectors', principal: editor });
  const other = await api.handle({ path: '/v1/studio/connectors', principal: otherEditor });
  assert.equal(own.body.connectors.length, 1);
  assert.equal(other.body.connectors.length, 0);

  const endpoint = await api.handle({
    method: 'PUT',
    path: '/v1/studio/connectors/openalex-two',
    principal: editor,
    idempotencyKey: 'connector-002',
    body: { source_id: 'openalex', access_mode: 'public', endpoint: 'https://api.openalex.org/works' },
  });
  assert.equal(endpoint.status, 400);
  assert.match(endpoint.body.detail, /no reviewed allowed_origins/);
});

test('connector API rejects nested secrets, activation, unsupported sources, and viewer writes', async () => {
  const { api } = setup();
  const cases = [
    { principal: editor, body: { source_id: 'openalex', access_mode: 'public', nested: { api_key: 'value' } }, detail: /secret-like/ },
    { principal: editor, body: { source_id: 'openalex', access_mode: 'public', activation_state: 'enabled' }, detail: /remain disabled/ },
    { principal: editor, body: { source_id: 'missing', access_mode: 'public' }, detail: /not in the reviewed registry/ },
  ];
  for (const [index, item] of cases.entries()) {
    const result = await api.handle({
      method: 'PUT',
      path: `/v1/studio/connectors/case-${index}`,
      principal: item.principal,
      idempotencyKey: `connector-case-${index}`,
      body: item.body,
    });
    assert.equal(result.status, 400);
    assert.match(result.body.detail, item.detail);
  }
  const denied = await api.handle({
    method: 'PUT',
    path: '/v1/studio/connectors/viewer-one',
    principal: viewer,
    idempotencyKey: 'connector-viewer',
    body: { source_id: 'openalex', access_mode: 'public' },
  });
  assert.equal(denied.status, 403);
});

test('only system operators can toggle the global pause', async () => {
  const { api } = setup();
  const denied = await api.handle({
    method: 'PUT', path: '/v1/studio/control/global-pause', principal: editor,
    idempotencyKey: 'pause-denied', body: { paused: false },
  });
  assert.equal(denied.status, 403);
  const allowed = await api.handle({
    method: 'PUT', path: '/v1/studio/control/global-pause', principal: operator,
    idempotencyKey: 'pause-allowed', body: { paused: false },
  });
  assert.deepEqual(allowed, { status: 200, body: { paused: false } });
});

test('exceptions expose limited transitions and redacted append-only audit', async () => {
  const { store, api } = setup();
  await store.put(accountScope(editor), 'exceptions', {
    id: 'rights-one', reason_code: 'RIGHTS_NOT_CLEARED', state: 'open',
  }, { principal: editor, idempotencyKey: 'exception-seed', operation: 'exceptions.seed' });
  const hold = await api.handle({
    method: 'PUT', path: '/v1/studio/exceptions/rights-one', principal: editor,
    idempotencyKey: 'exception-hold', body: { action: 'hold' },
  });
  assert.equal(hold.body.state, 'held');
  const publish = await api.handle({
    method: 'PUT', path: '/v1/studio/exceptions/rights-one', principal: editor,
    idempotencyKey: 'exception-publish', body: { action: 'publish' },
  });
  assert.equal(publish.status, 400);
  const audit = await api.handle({ path: '/v1/studio/audit', principal: editor });
  assert.equal(audit.status, 200);
  assert.equal(audit.body.events.length, 2);
  assert.doesNotMatch(JSON.stringify(audit.body), /credential_ref.*citewire/);
});

test('assessment definitions never imply a running scheduler', async () => {
  const { api } = setup();
  const result = await api.handle({ path: '/v1/studio/assessments', principal: viewer });
  assert.equal(result.status, 200);
  assert.ok(result.body.assessments.every((assessment) => assessment.execution === 'disabled'));
});
