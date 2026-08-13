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

const ATTRIBUTION_CASES = [
  {
    provider: 'gdelt-doc',
    tool: 'gdelt.search',
    body: { articles: [{ title: 'News', url: 'https://example.test/news' }] },
    expected: { name: 'GDELT Project', url: 'https://www.gdeltproject.org/' },
  },
  {
    provider: 'gdelt-context',
    tool: 'gdelt.context',
    body: {
      articles: [
        {
          title: 'Context',
          url: 'https://example.test/context',
          sentence: 'Preserve the API-provided context sentence.',
          domain: 'example.test',
        },
      ],
    },
    expected: { name: 'GDELT Project', url: 'https://www.gdeltproject.org/' },
  },
  {
    provider: 'semanticscholar',
    tool: 'semanticscholar.search',
    body: { data: [{ title: 'Paper', authors: [] }] },
    expected: { name: 'Semantic Scholar', url: 'https://www.semanticscholar.org/' },
  },
  {
    provider: 'europepmc',
    tool: 'europepmc.search',
    body: { resultList: { result: [{ id: 'PMC1', title: 'Biomedical record' }] } },
    expected: { name: 'Europe PMC', url: 'https://europepmc.org/' },
  },
];

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

for (const attributionCase of ATTRIBUTION_CASES) {
  test(`${attributionCase.tool} returns stable structured and text attribution`, async () => {
    const fetch = fakeFetch(attributionCase.body);
    const tools = providerTools({
      providers: { [attributionCase.provider]: { enabled: true } },
      fetch,
    });
    const search = tools.find((tool) => tool.name === attributionCase.tool);
    assert.ok(search, `expected ${attributionCase.tool}`);

    const result = await search.handler({ query: 'test', limit: 1 });

    assert.equal(result.isError, false);
    assert.deepEqual(result.structuredContent.attribution, attributionCase.expected);
    assert.equal(
      result.structuredContent.citation,
      `${attributionCase.expected.name}: ${attributionCase.expected.url}`,
    );
    assert.equal(result.structuredContent.items.length, 1);
    if (attributionCase.tool === 'gdelt.context') {
      assert.deepEqual(result.structuredContent.items[0], attributionCase.body.articles[0]);
    }
    assert.equal(
      result.content[1].text,
      `Attribution: ${attributionCase.expected.name} (${attributionCase.expected.url})`,
    );
  });
}

test('Crossref requires deployer mailto and identifies the request in query and User-Agent', async () => {
  const missingFetch = fakeFetch({ message: { items: [] } });
  const missingTool = providerTools({
    providers: { crossref: { enabled: true } },
    fetch: missingFetch,
  }).find((tool) => tool.name === 'crossref.search');
  const missing = await missingTool.handler({ query: 'test' });
  assert.equal(missing.isError, true);
  assert.match(missing.content[0].text, /providers\.crossref\.mailto/);
  assert.equal(missingFetch.calls.length, 0);

  const fetch = fakeFetch({ message: { items: [] } });
  const tool = providerTools({
    providers: { crossref: { enabled: true, mailto: 'operator@example.test' } },
    fetch,
  }).find((candidate) => candidate.name === 'crossref.search');
  const result = await tool.handler({ query: 'test' });

  assert.equal(result.isError, false);
  assert.equal(new URL(fetch.calls[0].url).searchParams.get('mailto'), 'operator@example.test');
  assert.equal(
    fetch.calls[0].init.headers['User-Agent'],
    'citewire/0.2.0 (+https://github.com/MeekPhills/citewire; mailto:operator@example.test)',
  );
});

test('Semantic Scholar keeps the abstract field but limits it to a short excerpt', async () => {
  const fullAbstract = 'x'.repeat(450);
  const fetch = fakeFetch({ data: [{ title: 'Paper', abstract: fullAbstract, authors: [] }] });
  const tool = providerTools({
    providers: { semanticscholar: { enabled: true } },
    fetch,
  }).find((candidate) => candidate.name === 'semanticscholar.search');
  const result = await tool.handler({ query: 'test' });
  const item = result.structuredContent.items[0];

  assert.equal(item.abstract.length, 400);
  assert.equal(item.abstract, fullAbstract.slice(0, 400));
  assert.equal(item.abstract_truncated, true);
});

test('Hacker News results include a canonical HN item link', async () => {
  const fetch = fakeFetch({ id: 42, title: 'A story', url: 'https://example.test/story' });
  const tool = providerTools({
    providers: { hackernews: { enabled: true } },
    fetch,
  }).find((candidate) => candidate.name === 'hackernews.item');
  const result = await tool.handler({ id: 42 });

  assert.equal(result.structuredContent.item.url, 'https://example.test/story');
  assert.equal(
    result.structuredContent.item.hn_url,
    'https://news.ycombinator.com/item?id=42',
  );
});

test('DEV results preserve author attribution and canonical URL', async () => {
  const fetch = fakeFetch([
    {
      title: 'Article',
      url: 'https://dev.to/author/article',
      user: { name: 'Author Name' },
      tag_list: ['ai'],
    },
  ]);
  const tool = providerTools({
    providers: { devto: { enabled: true } },
    fetch,
  }).find((candidate) => candidate.name === 'devto.search');
  const result = await tool.handler({ tag: 'ai' });

  assert.equal(result.structuredContent.items[0].user, 'Author Name');
  assert.equal(result.structuredContent.items[0].url, 'https://dev.to/author/article');
  assert.equal(
    fetch.calls[0].init.headers['User-Agent'],
    'citewire/0.2.0 (+https://github.com/MeekPhills/citewire)',
  );
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
