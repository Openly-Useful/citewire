import { test } from 'node:test';
import assert from 'node:assert/strict';

const { platformTools } = await import('../src/platform/tools.js');

const PLATFORM = { name: 'Example News', siteUrl: 'https://news.example', apiBase: 'https://api.example/v1' };

// Build a fake fetch that records the last request and returns a canned response.
function fakeFetch({ ok = true, status = 200, body = {} } = {}) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url: String(url), init });
    return {
      ok,
      status,
      async json() {
        return body;
      },
      async text() {
        return JSON.stringify(body);
      },
    };
  };
  fn.calls = calls;
  return fn;
}

function byName(tools, name) {
  const t = tools.find((x) => x.name === name);
  assert.ok(t, `tool ${name} should exist`);
  return t;
}

test('absent platform -> empty array', () => {
  assert.deepEqual(platformTools({}), []);
  assert.deepEqual(platformTools({ platform: undefined }), []);
});

test('configured platform yields the 4 expected tools', () => {
  const tools = platformTools({ platform: PLATFORM });
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, ['news.about', 'news.get', 'news.list', 'news.topics']);
});

test('news.about works with no fetch injected at all', async () => {
  const tools = platformTools({ platform: PLATFORM });
  const about = byName(tools, 'news.about');
  const res = await about.handler({});
  assert.equal(res.isError, false);
  assert.equal(res.structuredContent.server.version, '0.2.0');
  assert.equal(res.content[0].type, 'text');
  assert.match(res.content[0].text, /Example News|news\.example/);
});

test('news.list passes only provided args as query params', async () => {
  const fetch = fakeFetch({ body: { items: [] } });
  const tools = platformTools({ platform: PLATFORM, fetch });
  const list = byName(tools, 'news.list');
  const res = await list.handler({ q: 'energy', topic: 'markets' });
  assert.equal(res.isError, false);
  assert.equal(fetch.calls.length, 1);
  assert.equal(
    fetch.calls[0].init.headers['User-Agent'],
    'citewire/0.2.0 (+https://github.com/Openly-Useful/citewire)',
  );
  const requested = new URL(fetch.calls[0].url);
  assert.equal(requested.searchParams.get('q'), 'energy');
  assert.equal(requested.searchParams.get('topic'), 'markets');
  // No stray params for filters that were not provided.
  assert.equal(requested.searchParams.get('industry'), null);
  assert.equal(requested.searchParams.get('cursor'), null);
  assert.ok(requested.href.startsWith('https://api.example/v1'));
});

test('news.list with no args sends no query params', async () => {
  const fetch = fakeFetch({ body: { items: [] } });
  const tools = platformTools({ platform: PLATFORM, fetch });
  const list = byName(tools, 'news.list');
  await list.handler({});
  const requested = new URL(fetch.calls[0].url);
  assert.equal([...requested.searchParams.keys()].length, 0);
});

test('news.get requests apiBase/<slug>', async () => {
  const fetch = fakeFetch({ body: { id: 'abc', title: 'A' } });
  const tools = platformTools({ platform: PLATFORM, fetch });
  const get = byName(tools, 'news.get');
  const res = await get.handler({ slug: 'abc' });
  assert.equal(res.isError, false);
  assert.equal(fetch.calls.length, 1);
  assert.ok(
    fetch.calls[0].url.startsWith('https://api.example/v1/abc'),
    `expected apiBase/<slug>, got ${fetch.calls[0].url}`,
  );
});

test('non-2xx responses become isError tool results (news.list)', async () => {
  const fetch = fakeFetch({ ok: false, status: 503, body: { error: 'down' } });
  const tools = platformTools({ platform: PLATFORM, fetch });
  const list = byName(tools, 'news.list');
  const res = await list.handler({ q: 'x' });
  assert.equal(res.isError, true);
  assert.equal(res.content[0].type, 'text');
});

test('non-2xx responses become isError tool results (news.get)', async () => {
  const fetch = fakeFetch({ ok: false, status: 404, body: { error: 'missing' } });
  const tools = platformTools({ platform: PLATFORM, fetch });
  const get = byName(tools, 'news.get');
  const res = await get.handler({ slug: 'nope' });
  assert.equal(res.isError, true);
});

test('news.topics returns a non-error result when fetch succeeds', async () => {
  const fetch = fakeFetch({ body: { topics: ['energy', 'ai'] } });
  const tools = platformTools({ platform: PLATFORM, fetch });
  const topics = byName(tools, 'news.topics');
  const res = await topics.handler({});
  assert.equal(res.isError, false);
});

test('every platform tool has name, description, inputSchema, and a handler', () => {
  const tools = platformTools({ platform: PLATFORM });
  for (const t of tools) {
    assert.equal(typeof t.name, 'string');
    assert.equal(typeof t.title, 'string');
    assert.equal(typeof t.description, 'string');
    assert.ok(t.inputSchema);
    assert.equal(t.annotations.readOnlyHint, true);
    assert.equal(t.annotations.destructiveHint, false);
    assert.equal(typeof t.handler, 'function');
  }
});
