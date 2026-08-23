import assert from 'node:assert/strict';
import test from 'node:test';
import { createEditorialArticleTools } from '../src/community/mcp-articles.js';
import { createRssProjection } from '../src/community/rss.js';
import { sha256 } from '../src/editorial/idempotency.js';
import { appendDecisionTrace, createDecisionTrace } from '../src/editorial/trace.js';

function publishableTrace() {
  const states = ['fetched', 'rights_checked', 'classified', 'summarized', 'verified', 'publishable'];
  let trace = createDecisionTrace();
  for (let index = 0; index < states.length - 1; index += 1) {
    trace = appendDecisionTrace(trace, {
      event_id: `projection-${index + 1}`,
      item_id: 'article-1',
      from_state: states[index],
      to_state: states[index + 1],
      stage: states[index],
      verdict: 'allow',
      reason_codes: [],
      policy_version: 'policy-1',
      input_hash: sha256({ index }),
      actor: 'system:test',
      run_id: 'projection-run',
      created_at: `2026-08-16T12:00:0${index}.000Z`,
    });
  }
  return trace;
}

function setup() {
  const eligible = {
    id: 'article-1',
    revision: 'r1',
    version: 6,
    state: 'publishable',
    title: 'Power & compute',
    publisher: 'Example Publisher',
    published_at: '2026-08-16T10:00:00.000Z',
    canonical_url: 'https://example.test/a?b=1&c=2',
    source_id: 'source-1',
    summary: 'SHOULD NOT APPEAR',
    body: 'PRIVATE SOURCE BODY',
    credential_ref: 'vault://not-returned',
    inclusion_tier: 'adjacent',
    inclusion_reasons: ['ADJACENT_BAND'],
  };
  const held = { ...eligible, id: 'held-1', state: 'held', canonical_url: 'https://example.test/held' };
  const trace = publishableTrace();
  const store = {
    listItems: (accountId) => accountId === 'account-a' ? [eligible, held] : [],
    getItem: (accountId, id) => accountId === 'account-a' && id === eligible.id ? eligible : null,
    getTrace: () => trace,
    listExceptions: () => [],
  };
  const rightsEvaluator = async ({ operation }) => operation === 'metadata'
    ? { allowed: true, decision: 'allow', reasons: [] }
    : { allowed: false, decision: 'hold', reasons: ['USE_NOT_ALLOWED'] };
  const pauseController = { get: () => ({ paused: false }) };
  return { eligible, store, rightsEvaluator, pauseController };
}

test('RSS preview is rights gated, omits unapproved summary, and performs no output', async () => {
  const { store, rightsEvaluator, pauseController } = setup();
  const projection = createRssProjection({ store, rightsEvaluator, pauseController });
  const result = await projection.preview({
    accountId: 'account-a',
    feed: { title: 'CiteWire preview', homeUrl: 'https://citewire.org', feedUrl: 'https://citewire.org/feed.xml', description: 'Metadata preview' },
  });
  assert.equal(result.manifest.projected_count, 1);
  assert.equal(result.manifest.held_count, 1);
  assert.match(result.xml, /Power &amp; compute/);
  assert.doesNotMatch(result.xml, /SHOULD NOT APPEAR|PRIVATE SOURCE BODY|vault:\/\//);
  assert.doesNotMatch(result.xml, /<category>/);
});

test('MCP article projection is uncomposed, read-only, scoped, and whitelisted', async () => {
  const { store, rightsEvaluator, pauseController } = setup();
  const tools = createEditorialArticleTools({ accountId: 'account-a', store, rightsEvaluator, pauseController });
  assert.deepEqual(tools.map((tool) => tool.name), ['search_articles', 'get_article']);
  assert.ok(tools.every((tool) => tool.annotations.readOnlyHint && !tool.annotations.openWorldHint));
  const search = await tools[0].handler({ query: 'power' });
  assert.equal(search.structuredContent.count, 1);
  const serialized = JSON.stringify(search.structuredContent);
  assert.doesNotMatch(serialized, /PRIVATE SOURCE BODY|vault:\/\//);
  assert.equal(search.structuredContent.articles[0].summary, '');

  const otherAccountTools = createEditorialArticleTools({ accountId: 'account-b', store, rightsEvaluator, pauseController });
  const other = await otherAccountTools[0].handler({ query: '' });
  assert.equal(other.structuredContent.count, 0);
});

test('global pause makes both projections fail closed', async () => {
  const { store, rightsEvaluator } = setup();
  const pauseController = { get: () => ({ paused: true }) };
  const rss = await createRssProjection({ store, rightsEvaluator, pauseController }).preview({
    accountId: 'account-a',
    feed: { title: 'Paused', homeUrl: 'https://citewire.org', feedUrl: 'https://citewire.org/feed.xml', description: 'Paused' },
  });
  assert.equal(rss.manifest.projected_count, 0);
  const get = createEditorialArticleTools({ accountId: 'account-a', store, rightsEvaluator, pauseController })[1];
  const result = await get.handler({ id: 'article-1' });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /GLOBAL_PAUSE_ACTIVE/);
});
