import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CLASSIFIER_MODEL_CARD,
  classifyInclusion,
  validateThresholds,
} from '../src/community/classifier.js';
import {
  communityResources,
  communityResourceTemplates,
  communityTools,
} from '../src/community/mcp.js';
import {
  getSource,
  listSources,
  loadDefaultRegistry,
  loadRegistrySchema,
  validateRegistry,
} from '../src/community/registry.js';
import { evaluateRights } from '../src/community/rights.js';
import { validateConfig } from '../src/config.js';

const registry = loadDefaultRegistry();
const NOW = '2026-08-16T12:00:00.000Z';

function scoreInput(value) {
  return {
    title: 'A source-backed record',
    publisher: 'Example Publisher',
    published_at: '2026-08-16T10:00:00.000Z',
    canonical_url: 'https://example.test/item',
    rights_decision: 'allow',
    source_quality: value,
    topical_relevance: value,
    freshness: value,
    rights_confidence: value,
    evidence_density: value,
  };
}

test('default registry passes runtime validation and every source remains disabled', () => {
  const schema = loadRegistrySchema();
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  const sourceSchema = schema.properties.sources.items.properties;
  for (const field of [sourceSchema.homepage, sourceSchema.review.properties.review_basis]) {
    const pattern = new RegExp(field.pattern);
    assert.equal(pattern.test('https://example.test/policy'), true);
    assert.equal(pattern.test('ftp://example.test/policy'), false);
    assert.equal(pattern.test('https://user@example.test/policy'), false);
  }
  assert.equal(registry.schema_version, '1.0.0');
  assert.ok(registry.sources.length >= 5);
  assert.ok(registry.sources.every((source) => source.enabled_by_default === false));
  assert.deepEqual(validateRegistry(registry), registry);
  for (const source of registry.sources) {
    assert.doesNotThrow(() => new URL(source.homepage));
    assert.doesNotThrow(() => new URL(source.review.review_basis));
    assert.ok(source.rights.notice);
  }
});

test('runtime registry validation rejects activation, unknown policy, nested secrets, and duplicate ids', () => {
  const activated = structuredClone(registry);
  activated.sources[0].enabled_by_default = true;
  assert.throws(() => validateRegistry(activated), /must remain false/);

  const unknown = structuredClone(registry);
  unknown.sources[0].rights.unreviewed_rule = true;
  assert.throws(() => validateRegistry(unknown), /not supported/);

  const nestedSecret = structuredClone(registry);
  nestedSecret.sources[0].rights.connection = { api_key: 'not-a-real-key' };
  assert.throws(() => validateRegistry(nestedSecret), /secret-like fields/);

  const duplicate = structuredClone(registry);
  duplicate.sources.push(structuredClone(duplicate.sources[0]));
  assert.throws(() => validateRegistry(duplicate), /unique source ids/);

  const impossibleTimestamp = structuredClone(registry);
  impossibleTimestamp.generated_at = '2026-02-30T12:00:00.000Z';
  assert.throws(() => validateRegistry(impossibleTimestamp), /ISO date-time/);
});

test('Community config is explicit, shadow-only, and validates configurable bands', () => {
  const config = {
    community: {
      enabled: true,
      classifierMode: 'shadow',
      thresholds: { adjacent_min: 0.52, standard_min: 0.63 },
    },
  };
  assert.deepEqual(validateConfig(config), config);
  assert.throws(() => validateConfig({ community: {} }), /community.enabled/);
  assert.throws(
    () => validateConfig({ community: { enabled: true, classifierMode: 'active' } }),
    /must remain shadow/,
  );
  assert.throws(
    () => validateConfig({ community: { enabled: true, thresholds: { adjacent_min: 0.7, standard_min: 0.6 } } }),
    /adjacent_min/,
  );
  assert.deepEqual(validateThresholds({ adjacent_min: 0.4, standard_min: 0.8 }), {
    adjacent_min: 0.4,
    standard_min: 0.8,
  });
});

test('rights evaluation fails closed and never returns a credential reference', () => {
  const openalex = getSource(registry, 'openalex');
  const credentialRef = 'vault://citewire/openalex/account-a';
  const allowed = evaluateRights({
    source: openalex,
    accessMode: 'organization_credential',
    credentialRef,
    useCase: 'organization_internal',
    operation: 'metadata',
  });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.credential_reference_present, true);
  assert.doesNotMatch(JSON.stringify(allowed), /vault:\/\/citewire|"credential_ref"/);

  const missing = evaluateRights({
    source: openalex,
    accessMode: 'organization_credential',
    useCase: 'organization_internal',
    operation: 'metadata',
  });
  assert.equal(missing.decision, 'hold');
  assert.ok(missing.reasons.includes('CREDENTIAL_REFERENCE_REQUIRED'));

  const unknown = evaluateRights({
    source: null,
    accessMode: 'public',
    useCase: 'public_brief',
    operation: 'metadata',
  });
  assert.equal(unknown.decision, 'hold');
  assert.ok(unknown.reasons.includes('SOURCE_POLICY_MISSING'));

  const incomplete = evaluateRights({
    source: {
      id: 'unreviewed',
      rights: {
        access_modes: ['public'],
        allowed_operations: { public_brief: ['metadata'] },
      },
    },
    accessMode: 'public',
    useCase: 'public_brief',
    operation: 'metadata',
  });
  assert.equal(incomplete.decision, 'hold');
  assert.equal(incomplete.allowed, false);
  assert.ok(incomplete.reasons.includes('SOURCE_POLICY_INVALID'));
  assert.equal(incomplete.source_id, null);
  assert.match(incomplete.policy_notice, /Hold by default/);
});

test('classifier applies configurable score bands but is permanently observe-only in this phase', () => {
  const adjacent = classifyInclusion(scoreInput(0.5), { now: NOW });
  assert.equal(adjacent.inclusion_tier, 'adjacent');
  assert.equal(adjacent.publishable, false);
  assert.equal(adjacent.mode, 'shadow');
  assert.equal(adjacent.evaluated_at, NOW);
  assert.ok(adjacent.inclusion_reasons.includes('ADJACENT_BAND'));

  const configuredHold = classifyInclusion(scoreInput(0.65), {
    now: NOW,
    thresholds: { adjacent_min: 0.7, standard_min: 0.8 },
  });
  assert.equal(configuredHold.inclusion_tier, 'held');
  assert.equal(configuredHold.publishable, false);

  const standard = classifyInclusion(scoreInput(0.9), { now: NOW, mode: 'active' });
  assert.equal(standard.inclusion_tier, 'standard');
  assert.equal(standard.publishable, false);
  assert.equal(CLASSIFIER_MODEL_CARD.default_mode, 'shadow');
});

test('classifier abstains on missing rights, attribution, time, URL, or feature evidence', () => {
  const decision = classifyInclusion({
    ...scoreInput(0.9),
    rights_decision: 'hold',
    publisher: '',
    published_at: 'not-a-date',
    canonical_url: 'https://user:password@example.test/item',
    evidence_density: undefined,
  }, { now: NOW });
  assert.equal(decision.abstained, true);
  assert.equal(decision.score, null);
  assert.equal(decision.inclusion_tier, 'held');
  assert.equal(decision.publishable, false);
  assert.ok(decision.inclusion_reasons.includes('FEATURES_INCOMPLETE'));
  assert.ok(decision.inclusion_reasons.includes('RIGHTS_NOT_CLEARED'));
  assert.ok(decision.inclusion_reasons.includes('PUBLISHER_MISSING'));
  assert.ok(decision.inclusion_reasons.includes('PUBLISHED_AT_INVALID'));
  assert.ok(decision.inclusion_reasons.includes('CANONICAL_URL_INVALID'));

  const impossibleDate = classifyInclusion({
    ...scoreInput(0.9),
    published_at: '2026-02-30T10:00:00.000Z',
  }, { now: NOW });
  assert.equal(impossibleDate.abstained, true);
  assert.ok(impossibleDate.inclusion_reasons.includes('PUBLISHED_AT_INVALID'));
});

test('source filtering rejects invalid review dates instead of silently widening results', () => {
  assert.ok(listSources(registry, { type: 'research' }).length >= 2);
  assert.throws(() => listSources(registry, { dueBefore: 'not-a-date' }), /valid ISO date-time/);
});

test('Community MCP tools use canonical names, stay local, and expose no catalog data', async () => {
  assert.deepEqual(communityTools({}), []);
  const tools = communityTools({ community: { enabled: true } });
  assert.deepEqual(tools.map((tool) => tool.name), [
    'search_articles',
    'get_article',
    'list_topics',
    'list_sources',
    'evaluate_rights',
    'explain_inclusion',
    'get_health',
  ]);
  const health = await tools.find((tool) => tool.name === 'get_health').handler({});
  assert.equal(health.structuredContent.external_calls, false);
  assert.equal(health.structuredContent.sources_enabled_by_default, 0);
  assert.equal(health.structuredContent.classifier_mode, 'shadow');
  const search = await tools.find((tool) => tool.name === 'search_articles').handler({ query: 'power' });
  assert.deepEqual(search.structuredContent.articles, []);
  assert.equal(search.structuredContent.catalog_configured, false);
});

test('Community resources expose policy, health, and source templates without handlers', async () => {
  assert.deepEqual(communityResources({}), []);
  assert.deepEqual(communityResourceTemplates({}), []);
  const config = { community: { enabled: true } };
  const resources = communityResources(config);
  assert.ok(resources.some((resource) => resource.uri === 'citewire://policy'));
  assert.ok(resources.some((resource) => resource.uri === 'citewire://health'));
  assert.ok(resources.some((resource) => resource.uri === 'citewire://sources/openalex'));
  const templates = communityResourceTemplates(config);
  assert.deepEqual(templates.map((template) => template.uriTemplate), [
    'citewire://articles/{id}',
    'citewire://topics/{slug}',
    'citewire://sources/{id}',
  ]);
  const sourceTemplate = templates.find((template) => template.uriTemplate === 'citewire://sources/{id}');
  const content = await sourceTemplate.read('citewire://sources/openalex');
  assert.equal(content.mimeType, 'application/json');
  assert.match(content.text, /OpenAlex/);
});
