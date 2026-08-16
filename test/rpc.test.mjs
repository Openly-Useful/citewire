import { test } from 'node:test';
import assert from 'node:assert/strict';

const { createServer, toolJson, toolError } = await import('../src/core/rpc.js');

function makeServer() {
  const tools = [
    {
      name: 'echo.say',
      description: 'Echoes back its message.',
      inputSchema: { type: 'object', properties: { msg: { type: 'string' } } },
      handler: async (args) => toolJson({ said: args?.msg ?? null }),
    },
    {
      name: 'boom.explode',
      description: 'Always throws.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        throw new Error('kaboom');
      },
    },
  ];
  return createServer({
    serverInfo: { name: 'citewire-test', version: '9.9.9' },
    instructions: 'test instructions',
    tools,
  });
}

function req(method, params, id = 1) {
  return { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) };
}

test('createServer returns handle and tools', () => {
  const server = makeServer();
  assert.equal(typeof server.handle, 'function');
  assert.ok(Array.isArray(server.tools));
  assert.equal(server.tools.length, 2);
});

test('initialize echoes serverInfo and advertises protocol + tools capability', async () => {
  const server = makeServer();
  const res = await server.handle(req('initialize', {}));
  assert.equal(res.jsonrpc, '2.0');
  assert.equal(res.result.protocolVersion, '2025-06-18');
  assert.ok(res.result.capabilities);
  assert.ok(res.result.capabilities.tools, 'capabilities.tools present');
  assert.deepEqual(res.result.serverInfo, { name: 'citewire-test', version: '9.9.9' });
});

test('ping returns empty result object', async () => {
  const server = makeServer();
  const res = await server.handle(req('ping', {}));
  assert.deepEqual(res.result, {});
});

test('tools/list returns descriptors without handler property', async () => {
  const server = makeServer();
  const res = await server.handle(req('tools/list', {}));
  assert.ok(Array.isArray(res.result.tools));
  assert.equal(res.result.tools.length, 2);
  for (const t of res.result.tools) {
    assert.equal(typeof t.name, 'string');
    assert.equal(typeof t.description, 'string');
    assert.ok(t.inputSchema, 'inputSchema present');
    assert.ok(!('handler' in t), `tool ${t.name} must not expose handler`);
  }
});

test('tools/list preserves optional titles, output schemas, and annotations', async () => {
  const annotated = createServer({
    serverInfo: { name: 'test', version: '1.0.0' },
    tools: [{
      name: 'test.read',
      title: 'Read a test value',
      description: 'Read one value.',
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'object', properties: { value: { type: 'string' } } },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
      handler: async () => toolJson({ value: 'ok' }),
    }],
  });
  const response = await annotated.handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  const [tool] = response.result.tools;
  assert.equal(tool.title, 'Read a test value');
  assert.equal(tool.outputSchema.properties.value.type, 'string');
  assert.equal(tool.annotations.readOnlyHint, true);
  assert.equal('handler' in tool, false);
});

test('tools/call returns a well-formed tool result', async () => {
  const server = makeServer();
  const res = await server.handle(req('tools/call', { name: 'echo.say', arguments: { msg: 'hi' } }));
  const result = res.result;
  assert.ok(Array.isArray(result.content));
  assert.equal(result.content[0].type, 'text');
  assert.equal(typeof result.content[0].text, 'string');
  assert.equal(result.isError, false);
  assert.match(result.content[0].text, /hi/);
});

test('tools/call on a throwing handler yields isError result, not a rejection', async () => {
  const server = makeServer();
  let res;
  await assert.doesNotReject(async () => {
    res = await server.handle(req('tools/call', { name: 'boom.explode', arguments: {} }));
  });
  assert.equal(res.result.isError, true);
  assert.ok(Array.isArray(res.result.content));
  assert.equal(res.result.content[0].type, 'text');
});

test('tools/call on unknown tool -> -32602', async () => {
  const server = makeServer();
  const res = await server.handle(req('tools/call', { name: 'does.not.exist', arguments: {} }));
  assert.ok(res.error);
  assert.equal(res.error.code, -32602);
});

test('unknown method -> -32601', async () => {
  const server = makeServer();
  const res = await server.handle(req('no/such/method', {}));
  assert.ok(res.error);
  assert.equal(res.error.code, -32601);
});

test('batch array request -> -32600', async () => {
  const server = makeServer();
  const res = await server.handle([req('ping', {}), req('ping', {}, 2)]);
  assert.ok(res.error);
  assert.equal(res.error.code, -32600);
});

test('empty object message -> -32600', async () => {
  const server = makeServer();
  const res = await server.handle({});
  assert.ok(res.error);
  assert.equal(res.error.code, -32600);
});

test('wrong jsonrpc version -> -32600', async () => {
  const server = makeServer();
  const res = await server.handle({ jsonrpc: '1.0', id: 1, method: 'ping' });
  assert.ok(res.error);
  assert.equal(res.error.code, -32600);
});

test('notifications/* resolve to undefined (no response)', async () => {
  const server = makeServer();
  const res = await server.handle({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(res, undefined);
});

test('toolJson and toolError produce valid tool-result shapes', () => {
  const ok = toolJson({ a: 1 });
  assert.ok(Array.isArray(ok.content));
  assert.equal(ok.content[0].type, 'text');
  assert.equal(ok.isError, false);

  const bad = toolError('something failed');
  assert.ok(Array.isArray(bad.content));
  assert.equal(bad.content[0].type, 'text');
  assert.equal(bad.isError, true);
  assert.match(bad.content[0].text, /something failed/);
});

test('resources and resource templates are additive and never expose reader functions', async () => {
  const server = createServer({
    serverInfo: { name: 'resource-test', version: '1.0.0' },
    tools: [],
    resources: [{
      uri: 'citewire://policy',
      name: 'Policy',
      description: 'Policy document.',
      mimeType: 'application/json',
      read: async () => ({ uri: 'citewire://policy', mimeType: 'application/json', text: '{"ok":true}' }),
    }],
    resourceTemplates: [{
      uriTemplate: 'citewire://sources/{id}',
      name: 'Source',
      description: 'Source policy.',
      mimeType: 'application/json',
      match: (uri) => uri === 'citewire://sources/example',
      read: async (uri) => ({ uri, mimeType: 'application/json', text: '{"id":"example"}' }),
    }],
  });
  const initialized = await server.handle(req('initialize', {}));
  assert.ok(initialized.result.capabilities.resources);

  const listed = await server.handle(req('resources/list', {}));
  assert.equal(listed.result.resources[0].uri, 'citewire://policy');
  assert.equal('read' in listed.result.resources[0], false);

  const templates = await server.handle(req('resources/templates/list', {}));
  assert.equal(templates.result.resourceTemplates[0].uriTemplate, 'citewire://sources/{id}');
  assert.equal('read' in templates.result.resourceTemplates[0], false);
  assert.equal('match' in templates.result.resourceTemplates[0], false);

  const exact = await server.handle(req('resources/read', { uri: 'citewire://policy' }));
  assert.equal(exact.result.contents[0].text, '{"ok":true}');
  const templated = await server.handle(req('resources/read', { uri: 'citewire://sources/example' }));
  assert.equal(templated.result.contents[0].text, '{"id":"example"}');
  const missing = await server.handle(req('resources/read', { uri: 'citewire://sources/missing' }));
  assert.equal(missing.error.code, -32602);
});

test('servers without resources preserve their original capability shape', async () => {
  const initialized = await makeServer().handle(req('initialize', {}));
  assert.equal(initialized.result.capabilities.resources, undefined);
});
