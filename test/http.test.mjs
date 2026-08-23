import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const { createHttpHandler, runHttp } = await import('../src/transports/http.js');
const { createServer } = await import('../src/core/rpc.js');
const { createCitewire } = await import('../src/index.js');
const { runStdio } = await import('../src/transports/stdio.js');

const MCP_ACCEPT = 'application/json, text/event-stream';
const INITIALIZE = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });

function makeServer() {
  return createServer({
    serverInfo: { name: 'citewire-http', version: '0.0.1' },
    instructions: 'http test',
    tools: [],
  });
}

// A req mock that behaves like a Node IncomingMessage stream when a body is given,
// but also exposes .body directly for express-ish handlers.
function makeReq({ method = 'POST', body, headers = {} } = {}) {
  const listeners = { data: [], end: [], error: [] };
  const requestHeaders = {
    accept: MCP_ACCEPT,
    'content-type': 'application/json',
    host: 'mcp.example.test',
    ...headers,
  };
  for (const [name, value] of Object.entries(requestHeaders)) {
    if (value === undefined) delete requestHeaders[name];
  }
  const req = {
    method,
    headers: requestHeaders,
    url: '/',
    body,
    socket: { encrypted: false },
    on(event, cb) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
      return req;
    },
    // Async-iterable so `for await (const chunk of req)` works too.
    async *[Symbol.asyncIterator]() {
      if (body !== undefined && body !== null) yield Buffer.from(String(body));
    },
  };
  // Drive the classic 'data'/'end' events on next tick.
  queueMicrotask(() => {
    if (body !== undefined && body !== null) {
      for (const cb of listeners.data) cb(Buffer.from(String(body)));
    }
    for (const cb of listeners.end) cb();
  });
  return req;
}

// Tolerant res mock: supports express-ish (status/json/setHeader) AND node-ish
// (writeHead/write/end/statusCode) styles. Captures statusCode, headers, body.
function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    _ended: false,
    setHeader(k, v) {
      this.headers[String(k).toLowerCase()] = v;
      return this;
    },
    getHeader(k) {
      return this.headers[String(k).toLowerCase()];
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.body = obj;
      this._ended = true;
      return this;
    },
    send(data) {
      this._captureBody(data);
      this._ended = true;
      return this;
    },
    writeHead(code, headers) {
      this.statusCode = code;
      if (headers) for (const [k, v] of Object.entries(headers)) this.setHeader(k, v);
      return this;
    },
    write(data) {
      this._captureBody(data);
      return this;
    },
    end(data) {
      if (data !== undefined) this._captureBody(data);
      this._ended = true;
      return this;
    },
    _captureBody(data) {
      if (data === undefined || data === null) return;
      if (typeof data === 'object' && !Buffer.isBuffer(data)) {
        this.body = data;
      } else {
        const prev = typeof this.body === 'string' ? this.body : '';
        this.body = prev + data.toString();
      }
    },
    // Normalize whatever was captured into a parsed object when it is JSON.
    parsed() {
      if (this.body === undefined) return undefined;
      if (typeof this.body === 'object') return this.body;
      try {
        return JSON.parse(this.body);
      } catch {
        return this.body;
      }
    },
  };
  return res;
}

test('createHttpHandler returns an async (req,res) handler', () => {
  const handler = createHttpHandler(makeServer());
  assert.equal(typeof handler, 'function');
});

test('GET -> 405 with Allow: POST', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({ method: 'GET' });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
  const allow = res.getHeader('allow');
  assert.ok(allow && /POST/i.test(String(allow)), `expected Allow: POST, got ${allow}`);
});

test('request without Origin is accepted for non-browser MCP clients', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({ body: INITIALIZE });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.parsed()?.result, 'initialize result present');
});

test('remote handler accepts its effective origin behind a proxy', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({
    body: INITIALIZE,
    headers: {
      host: 'internal.vercel.test',
      origin: 'https://mcp.example.test',
      'x-forwarded-host': 'mcp.example.test',
      'x-forwarded-proto': 'https',
    },
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.parsed()?.result, 'initialize result present');
});

test('remote handler rejects a cross-origin request before dispatch', async () => {
  let dispatches = 0;
  const handler = createHttpHandler({
    async handle() {
      dispatches++;
      return { jsonrpc: '2.0', id: 1, result: {} };
    },
  });
  const req = makeReq({ body: INITIALIZE, headers: { origin: 'https://attacker.example' } });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.parsed()?.error?.code, -32000);
  assert.equal(dispatches, 0);
});

test('remote handler accepts an explicitly allowed cross-origin deployment', async () => {
  const handler = createHttpHandler(makeServer(), { allowedOrigins: ['https://client.example'] });
  const req = makeReq({ body: INITIALIZE, headers: { origin: 'https://client.example' } });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.parsed()?.result, 'initialize result present');
});

test('malformed Origin -> 403', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({ body: INITIALIZE, headers: { origin: 'https://mcp.example.test/path' } });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 403);
});

test('POST without both required Accept media types -> 406', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({ body: INITIALIZE, headers: { accept: 'application/json' } });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 406);
  assert.equal(res.parsed()?.error?.code, -32000);
});

test('POST without application/json Content-Type -> 415', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({ body: INITIALIZE, headers: { 'content-type': 'text/plain' } });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 415);
  assert.equal(res.parsed()?.error?.code, -32000);
});

test('POST with unsupported MCP-Protocol-Version -> 400', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({ body: INITIALIZE, headers: { 'mcp-protocol-version': '2025-03-26' } });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.parsed()?.error?.code, -32600);
});

test('POST with malformed JSON body -> 400 with error.code -32700', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({ method: 'POST', body: '{bad' });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  const parsed = res.parsed();
  assert.ok(parsed && parsed.error, 'error body present');
  assert.equal(parsed.error.code, -32700);
});

test('POST notification -> 202 and no response body', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 202);
  assert.equal(res.body, undefined);
  assert.equal(res.getHeader('content-type'), undefined);
});

test('recognized method without id is still a notification -> 202 with no body', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({ body: JSON.stringify({ jsonrpc: '2.0', method: 'ping', params: {} }) });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 202);
  assert.equal(res.body, undefined);
});

test('POST initialize -> 200 with JSON-RPC result', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({
    method: 'POST',
    body: INITIALIZE,
    headers: { 'mcp-protocol-version': '2025-06-18' },
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  const parsed = res.parsed();
  assert.ok(parsed && parsed.result, 'result present');
  assert.equal(parsed.result.protocolVersion, '2025-06-18');
});

test('runHttp binds to 127.0.0.1 and only accepts loopback Origins', async (t) => {
  const httpServer = await runHttp(makeServer(), { port: 0 });
  t.after(
    () =>
      new Promise((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      }),
  );

  const address = httpServer.address();
  assert.ok(address && typeof address === 'object');
  assert.equal(address.address, '127.0.0.1');
  const endpoint = `http://127.0.0.1:${address.port}/`;
  const headers = { Accept: MCP_ACCEPT, 'Content-Type': 'application/json' };

  const rejected = await fetch(endpoint, {
    method: 'POST',
    headers: { ...headers, Origin: 'https://attacker.example' },
    body: INITIALIZE,
  });
  assert.equal(rejected.status, 403);

  const accepted = await fetch(endpoint, {
    method: 'POST',
    headers: { ...headers, Origin: 'http://localhost:4321' },
    body: INITIALIZE,
  });
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).result.protocolVersion, '2025-06-18');
});

test('runStdio is an importable function (smoke)', () => {
  assert.equal(typeof runStdio, 'function');
});

test('direct HTTP smoke exposes the local Community source registry without activation', async (t) => {
  const server = await runHttp(createCitewire({ community: { enabled: true } }), { port: 0 });
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  );
  const address = server.address();
  const endpoint = `http://127.0.0.1:${address.port}/`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Accept: MCP_ACCEPT, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: { name: 'list_sources', arguments: {} },
    }),
  });
  assert.equal(response.status, 200);
  const result = (await response.json()).result.structuredContent;
  assert.ok(result.sources.length >= 5);
  assert.ok(result.sources.every((source) => source.enabled_by_default === false));
});

test('direct stdio smoke exposes canonical Community tools without diagnostics on stdout', async () => {
  const indexUrl = new URL('../src/index.js', import.meta.url).href;
  const stdioUrl = new URL('../src/transports/stdio.js', import.meta.url).href;
  const script = [
    `import { createCitewire } from ${JSON.stringify(indexUrl)};`,
    `import { runStdio } from ${JSON.stringify(stdioUrl)};`,
    'runStdio(createCitewire({ community: { enabled: true } }));',
  ].join('\n');
  const child = spawn(process.execPath, ['--input-type=module', '--eval', script], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.stdin.end(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 9,
    method: 'tools/list',
    params: {},
  })}\n`);
  const [code] = await once(child, 'exit');
  assert.equal(code, 0, stderr);
  assert.equal(stderr, '');
  const lines = stdout.trim().split('\n');
  assert.equal(lines.length, 1);
  const response = JSON.parse(lines[0]);
  const names = response.result.tools.map((tool) => tool.name);
  assert.ok(names.includes('list_sources'));
  assert.ok(names.includes('explain_inclusion'));
  assert.doesNotMatch(stdout, /"handler"|vault:\/\//);
});
