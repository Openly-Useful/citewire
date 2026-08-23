import { test } from 'node:test';
import assert from 'node:assert/strict';

const { createCitewire } = await import('../src/index.js');

function req(method, params, id = 1) {
  return { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) };
}

test('createCitewire with empty config still serves initialize', async () => {
  const server = createCitewire({});
  assert.equal(typeof server.handle, 'function');
  assert.ok(Array.isArray(server.tools));
  const res = await server.handle(req('initialize', {}));
  assert.equal(res.result.protocolVersion, '2025-06-18');
  assert.ok(res.result.capabilities.tools);
});

test('createCitewire with empty config: tools/list resolves to an array', async () => {
  const server = createCitewire({});
  const res = await server.handle(req('tools/list', {}));
  assert.ok(Array.isArray(res.result.tools));
});

test('createCitewire composes platform + provider tools', async () => {
  const server = createCitewire({
    platform: { name: 'Example News', siteUrl: 'https://news.example', apiBase: 'https://api.example/v1' },
    providers: { openalex: { enabled: true } },
  });
  const res = await server.handle(req('tools/list', {}));
  const names = res.result.tools.map((t) => t.name);
  assert.ok(names.some((n) => n.startsWith('news.')), 'platform tools present');
  assert.ok(names.some((n) => n.startsWith('openalex.')), 'provider tools present');
  // Descriptors from tools/list never leak the handler property.
  for (const t of res.result.tools) {
    assert.ok(!('handler' in t));
  }
});

test('createCitewire adds the canonical Community contract only when explicitly enabled', async () => {
  const disabled = createCitewire({});
  assert.equal(disabled.resources.length, 0);
  assert.equal(disabled.resourceTemplates.length, 0);

  const server = createCitewire({ community: { enabled: true, classifierMode: 'shadow' } });
  const listed = await server.handle(req('tools/list', {}));
  const names = listed.result.tools.map((tool) => tool.name);
  for (const expected of [
    'search_articles',
    'get_article',
    'list_topics',
    'list_sources',
    'explain_inclusion',
    'get_health',
  ]) {
    assert.ok(names.includes(expected), `${expected} should be present`);
  }
  const initialized = await server.handle(req('initialize', {}));
  assert.ok(initialized.result.capabilities.resources);
  const policy = await server.handle(req('resources/read', { uri: 'citewire://policy' }));
  assert.match(policy.result.contents[0].text, /"classifier_mode": "shadow"/);

  const rejectedSecret = await server.handle(req('tools/call', {
    name: 'evaluate_rights',
    arguments: {
      source_id: 'openalex',
      access_mode: 'public',
      use_case: 'personal_research',
      operation: 'metadata',
      nested: { api_key: 'not-a-real-key' },
    },
  }));
  assert.equal(rejectedSecret.result.isError, true);
  assert.match(rejectedSecret.result.content[0].text, /secret-like fields/);
  assert.doesNotMatch(rejectedSecret.result.content[0].text, /not-a-real-key/);
});

test('createCitewire rejects an attempt to activate the foundation classifier', () => {
  assert.throws(
    () => createCitewire({ community: { enabled: true, classifierMode: 'active' } }),
    /must remain shadow/,
  );
});
