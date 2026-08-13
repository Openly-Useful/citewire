import { test } from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../src/providers/index.js');
const { providerTools, PROVIDERS } = mod;

const OPENALEX_BODY = {
  results: [
    {
      id: 'W1',
      title: 'T',
      publication_date: '2026-01-01',
      doi: 'x',
      cited_by_count: 1,
      open_access: { oa_url: null },
    },
  ],
};

function fakeFetch(body) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      status: 200,
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

test('empty config -> no tools (all providers off by default)', () => {
  assert.deepEqual(providerTools({}), []);
  assert.deepEqual(providerTools({ providers: {} }), []);
});

test('enabling openalex yields at least one openalex.* tool', () => {
  const tools = providerTools({ providers: { openalex: { enabled: true } } });
  assert.ok(tools.length >= 1);
  assert.ok(
    tools.some((t) => t.name.startsWith('openalex.')),
    `expected an openalex.* tool, got ${tools.map((t) => t.name).join(', ')}`,
  );
  assert.ok(tools.every((t) => t.annotations.readOnlyHint === true));
  assert.ok(tools.every((t) => typeof t.title === 'string' && t.title.length > 0));
});

test('a disabled provider contributes nothing even when another is enabled', () => {
  const tools = providerTools({ providers: { openalex: { enabled: true }, arxiv: { enabled: false } } });
  assert.ok(tools.every((t) => !t.name.startsWith('arxiv.')));
});

test('openalex.search with injected fake fetch returns 1 structured result, isError false', async () => {
  const fetch = fakeFetch(OPENALEX_BODY);
  const tools = providerTools({ providers: { openalex: { enabled: true } }, fetch });
  const search = tools.find((t) => t.name === 'openalex.search');
  assert.ok(search, `expected openalex.search, got ${tools.map((t) => t.name).join(', ')}`);
  const res = await search.handler({ query: 'x' });
  assert.equal(res.isError, false);
  assert.equal(
    fetch.calls[0].init.headers['User-Agent'],
    'citewire/0.2.0 (+https://github.com/MeekPhills/citewire)',
  );
  assert.ok(res.structuredContent, 'structuredContent present');
  const sc = res.structuredContent;
  const items = Array.isArray(sc) ? sc : sc.results ?? sc.items ?? sc.data;
  assert.ok(Array.isArray(items), 'structuredContent exposes a results array');
  assert.equal(items.length, 1);
});

test('PROVIDERS registry has >= 10 modules with required shape', () => {
  assert.ok(Array.isArray(PROVIDERS));
  assert.ok(PROVIDERS.length >= 10, `expected >= 10 providers, got ${PROVIDERS.length}`);
  const keys = PROVIDERS.map((p) => p.key);
  for (const expected of [
    'gdelt-doc',
    'gdelt-context',
    'arxiv',
    'openalex',
    'crossref',
    'semanticscholar',
    'europepmc',
    'dblp',
    'hackernews',
    'devto',
  ]) {
    assert.ok(keys.includes(expected), `PROVIDERS missing key ${expected}`);
  }
});

test('every PROVIDERS module has key, title, docsUrl, non-empty termsNote, and tools', () => {
  for (const p of PROVIDERS) {
    assert.equal(typeof p.key, 'string');
    assert.ok(p.key.length > 0, 'key non-empty');
    assert.equal(typeof p.title, 'string');
    assert.ok(p.title.length > 0, `title non-empty for ${p.key}`);
    assert.equal(typeof p.docsUrl, 'string');
    assert.ok(p.docsUrl.length > 0, `docsUrl non-empty for ${p.key}`);
    assert.equal(typeof p.termsNote, 'string', `termsNote is a string for ${p.key}`);
    assert.ok(p.termsNote.trim().length > 0, `termsNote non-empty for ${p.key}`);
    assert.ok(p.tools, `tools present for ${p.key}`);
  }
});
