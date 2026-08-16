import { toolJson, toolError } from '../core/rpc.js';
import {
  CLASSIFIER_MODEL_CARD,
  POLICY_VERSION,
  classifyInclusion,
  validateThresholds,
} from './classifier.js';
import { evaluateRights } from './rights.js';
import {
  assertNoSecretLikeFields,
  getSource,
  listSources,
  loadDefaultRegistry,
  validateRegistry,
} from './registry.js';

const READ_ONLY_LOCAL = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

function registryFor(config) {
  return config?.community?.registry
    ? validateRegistry(config.community.registry)
    : loadDefaultRegistry();
}

function thresholdsFor(config) {
  return validateThresholds(config?.community?.thresholds);
}

function inspectArguments(args, toolName) {
  assertNoSecretLikeFields(args, `${toolName}.arguments`);
  return args;
}

function healthDocument(registry, thresholds) {
  return {
    ok: true,
    foundation_state: 'policy_only',
    source_count: registry.sources.length,
    sources_enabled_by_default: 0,
    article_catalog_configured: false,
    classifier_mode: 'shadow',
    thresholds,
    external_calls: false,
    credentials_loaded: false,
  };
}

function policyDocument(thresholds) {
  return {
    policy_version: POLICY_VERSION,
    output_contract: 'metadata, canonical links, attribution, and rights-aware policy only',
    classifier_mode: 'shadow',
    classifier_thresholds: thresholds,
    automated_publication: false,
    unknown_rights_decision: 'hold',
    credential_handling: 'opaque references are evaluated in memory and never returned',
    visible_label_copy: 'owner_approval_required',
    classifier_model_card: CLASSIFIER_MODEL_CARD,
  };
}

function jsonResource(uri, name, description, value) {
  return {
    uri,
    name,
    description,
    mimeType: 'application/json',
    read: async () => ({
      uri,
      mimeType: 'application/json',
      text: `${JSON.stringify(value, null, 2)}\n`,
    }),
  };
}

function templateMatch(prefix) {
  return (uri) => typeof uri === 'string' && uri.startsWith(prefix) && uri.slice(prefix.length).length > 0;
}

export function communityResources(config = {}) {
  if (config?.community?.enabled !== true) return [];
  const registry = registryFor(config);
  const thresholds = thresholdsFor(config);
  return [
    jsonResource('citewire://policy', 'CiteWire policy', 'Current public rights and shadow-classifier policy.', policyDocument(thresholds)),
    jsonResource('citewire://health', 'CiteWire health', 'Non-sensitive local foundation status.', healthDocument(registry, thresholds)),
    ...registry.sources.map((source) => jsonResource(
      `citewire://sources/${encodeURIComponent(source.id)}`,
      `${source.name} source policy`,
      'Disabled-by-default source metadata, review basis, and allowed-use policy.',
      source,
    )),
  ];
}

export function communityResourceTemplates(config = {}) {
  if (config?.community?.enabled !== true) return [];
  const registry = registryFor(config);
  return [
    {
      uriTemplate: 'citewire://articles/{id}',
      name: 'CiteWire article metadata',
      description: 'Normalized article metadata when an article catalog is configured.',
      mimeType: 'application/json',
      match: templateMatch('citewire://articles/'),
      read: async () => null,
    },
    {
      uriTemplate: 'citewire://topics/{slug}',
      name: 'CiteWire topic metadata',
      description: 'Topic metadata when a topic catalog is configured.',
      mimeType: 'application/json',
      match: templateMatch('citewire://topics/'),
      read: async () => null,
    },
    {
      uriTemplate: 'citewire://sources/{id}',
      name: 'CiteWire source policy',
      description: 'Disabled-by-default source metadata, review basis, and allowed-use policy.',
      mimeType: 'application/json',
      match: templateMatch('citewire://sources/'),
      read: async (uri) => {
        let id;
        try {
          id = decodeURIComponent(uri.slice('citewire://sources/'.length));
        } catch {
          return null;
        }
        const source = getSource(registry, id);
        if (!source) return null;
        return {
          uri,
          mimeType: 'application/json',
          text: `${JSON.stringify(source, null, 2)}\n`,
        };
      },
    },
  ];
}

export function communityTools(config = {}) {
  if (config?.community?.enabled !== true) return [];
  const registry = registryFor(config);
  const thresholds = thresholdsFor(config);
  return [
    {
      name: 'search_articles',
      title: 'Search CiteWire articles',
      description: 'Search a configured article catalog. The policy-only foundation performs no fetches and returns an empty result.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          topic: { type: 'string' },
          source: { type: 'string' },
          published_after: { type: 'string' },
          published_before: { type: 'string' },
          access_mode: { enum: ['public', 'personal_credential', 'organization_credential'] },
          inclusion_tier: { enum: ['held', 'adjacent', 'standard'] },
          reason_tag: { type: 'string' },
        },
        additionalProperties: false,
      },
      annotations: READ_ONLY_LOCAL,
      handler: async (args) => {
        inspectArguments(args, 'search_articles');
        return toolJson({ articles: [], count: 0, catalog_configured: false, external_calls: false });
      },
    },
    {
      name: 'get_article',
      title: 'Get CiteWire article metadata',
      description: 'Get one normalized article record when a catalog is configured.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', minLength: 1 } },
        required: ['id'],
        additionalProperties: false,
      },
      annotations: READ_ONLY_LOCAL,
      handler: async (args) => {
        inspectArguments(args, 'get_article');
        return toolError('not_found: no article catalog is configured');
      },
    },
    {
      name: 'list_topics',
      title: 'List CiteWire topics',
      description: 'List configured topic identifiers. The policy-only foundation has no topic catalog.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: READ_ONLY_LOCAL,
      handler: async (args) => {
        inspectArguments(args, 'list_topics');
        return toolJson({ topics: [], catalog_configured: false });
      },
    },
    {
      name: 'list_sources',
      title: 'List CiteWire sources',
      description: 'List disabled-by-default source policy records. Registry presence never activates a source.',
      inputSchema: {
        type: 'object',
        properties: {
          type: { enum: ['news', 'editorial', 'newsletter', 'repository', 'research'] },
          due_before: { type: 'string', description: 'ISO date-time; include reviews due by this time.' },
        },
        additionalProperties: false,
      },
      annotations: READ_ONLY_LOCAL,
      handler: async (args) => {
        inspectArguments(args, 'list_sources');
        return toolJson({
          schema_version: registry.schema_version,
          sources: listSources(registry, { type: args.type, dueBefore: args.due_before }),
        });
      },
    },
    {
      name: 'evaluate_rights',
      title: 'Evaluate a proposed source use',
      description: 'Apply a fail-closed source policy. Opaque credential references are never returned or logged.',
      inputSchema: {
        type: 'object',
        properties: {
          source_id: { type: 'string' },
          access_mode: { enum: ['public', 'personal_credential', 'organization_credential'] },
          credential_ref: { type: 'string' },
          use_case: { enum: ['personal_research', 'organization_internal', 'public_brief', 'republication'] },
          operation: { enum: ['metadata', 'excerpt', 'summary', 'republication'] },
        },
        required: ['source_id', 'access_mode', 'use_case', 'operation'],
        additionalProperties: false,
      },
      annotations: READ_ONLY_LOCAL,
      handler: async (args) => {
        inspectArguments(args, 'evaluate_rights');
        return toolJson(evaluateRights({
          source: getSource(registry, args.source_id),
          accessMode: args.access_mode,
          credentialRef: args.credential_ref,
          useCase: args.use_case,
          operation: args.operation,
        }));
      },
    },
    {
      name: 'explain_inclusion',
      title: 'Explain a shadow inclusion score',
      description: 'Run the deterministic classifier in observe-only shadow mode and return auditable reasons.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          publisher: { type: 'string' },
          published_at: { type: 'string' },
          canonical_url: { type: 'string' },
          rights_decision: { enum: ['allow', 'hold'] },
          source_quality: { type: 'number', minimum: 0, maximum: 1 },
          topical_relevance: { type: 'number', minimum: 0, maximum: 1 },
          freshness: { type: 'number', minimum: 0, maximum: 1 },
          rights_confidence: { type: 'number', minimum: 0, maximum: 1 },
          evidence_density: { type: 'number', minimum: 0, maximum: 1 },
        },
        additionalProperties: false,
      },
      annotations: READ_ONLY_LOCAL,
      handler: async (args) => {
        inspectArguments(args, 'explain_inclusion');
        return toolJson(classifyInclusion(args, { thresholds }));
      },
    },
    {
      name: 'get_health',
      title: 'Read CiteWire Community health',
      description: 'Read non-sensitive local policy state without contacting an external provider.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: READ_ONLY_LOCAL,
      handler: async (args) => {
        inspectArguments(args, 'get_health');
        return toolJson(healthDocument(registry, thresholds));
      },
    },
  ];
}
