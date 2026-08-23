import { listSources } from '../../../src/community/registry.js';
import { assertNoCredentialMaterial } from '../../../src/security/credential-references.js';
import { redactForOutput } from '../../../src/security/redaction.js';
import { accountScope, capabilitiesFor, requireCapability, StudioAuthorizationError } from './authz.js';
import { serializeConnector, validateConnectorDefinition } from './connectors.js';
import { DEFAULT_ASSESSMENTS } from './schedules.js';
import { StudioConflictError } from './store.js';

function response(status, body) {
  return { status, body: redactForOutput(body) };
}

function rejectAccountOverride(value, path = 'body') {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    if (/^account(?:Id|_id)?$/i.test(key)) throw new TypeError(`${path}.${key} cannot override the trusted principal scope.`);
    rejectAccountOverride(nested, `${path}.${key}`);
  }
}

function mutationContext(principal, idempotencyKey, operation) {
  return { principal, idempotencyKey, operation };
}

export function createStudioApi({ store, sourceRegistry }) {
  if (!store) throw new TypeError('An injected account-scoped store is required.');
  if (!sourceRegistry) throw new TypeError('An injected reviewed source registry is required.');

  return {
    async handle({ method = 'GET', path = '/', principal, body = {}, idempotencyKey } = {}) {
      try {
        if (path === '/v1/studio/health' && method === 'GET') {
          return response(200, {
            ok: true,
            paused: await store.getGlobalPause(),
            external_calls: false,
            connector_activation: 'disabled',
            publishing: 'unavailable',
          });
        }

        requireCapability(principal, 'account:read');
        const scope = accountScope(principal);
        if (method !== 'GET') {
          assertNoCredentialMaterial(body);
          rejectAccountOverride(body);
        }

        if (path === '/v1/studio/session' && method === 'GET') {
          return response(200, { account: scope, capabilities: capabilitiesFor(principal) });
        }
        if (path === '/v1/studio/overview' && method === 'GET') {
          const [sources, connectors, exceptions] = await Promise.all([
            store.list(scope, 'source_settings'),
            store.list(scope, 'connectors'),
            store.list(scope, 'exceptions'),
          ]);
          return response(200, {
            paused: await store.getGlobalPause(),
            source_setting_count: sources.length,
            connector_count: connectors.length,
            exception_count: exceptions.filter((entry) => entry.state !== 'dismissed').length,
            connectors_enabled: 0,
          });
        }
        if (path === '/v1/studio/sources' && method === 'GET') {
          const settings = new Map((await store.list(scope, 'source_settings')).map((entry) => [entry.id, entry]));
          const sources = listSources(sourceRegistry).map((source) => ({
            id: source.id,
            name: source.name,
            type: source.type,
            review: source.review,
            enabled: false,
            settings: settings.get(source.id) ?? null,
          }));
          return response(200, { sources });
        }
        if (path === '/v1/studio/assessments' && method === 'GET') {
          return response(200, { assessments: DEFAULT_ASSESSMENTS });
        }
        if (path === '/v1/studio/connectors' && method === 'GET') {
          const connectors = await store.list(scope, 'connectors');
          return response(200, { connectors: connectors.map(serializeConnector) });
        }
        const connectorMatch = /^\/v1\/studio\/connectors\/([a-z0-9-]+)$/.exec(path);
        if (connectorMatch && method === 'PUT') {
          requireCapability(principal, 'account:write');
          if (body.id !== undefined && body.id !== connectorMatch[1]) throw new TypeError('Connector id must match the request path.');
          const connector = validateConnectorDefinition({ ...body, id: connectorMatch[1] }, sourceRegistry);
          const stored = await store.put(scope, 'connectors', connector, mutationContext(principal, idempotencyKey, 'connectors.configure'));
          return response(200, serializeConnector(stored));
        }
        if (path === '/v1/studio/exceptions' && method === 'GET') {
          return response(200, { exceptions: await store.list(scope, 'exceptions') });
        }
        const exceptionMatch = /^\/v1\/studio\/exceptions\/([A-Za-z0-9._-]+)$/.exec(path);
        if (exceptionMatch && method === 'PUT') {
          requireCapability(principal, 'account:write');
          const updated = await store.transitionException(
            scope,
            exceptionMatch[1],
            body.action,
            mutationContext(principal, idempotencyKey, 'exceptions.transition'),
          );
          return response(200, updated);
        }
        if (path === '/v1/studio/audit' && method === 'GET') {
          return response(200, await store.listAudit(scope));
        }
        if (path === '/v1/studio/control/global-pause' && method === 'PUT') {
          requireCapability(principal, 'system:pause');
          return response(200, await store.setGlobalPause(body.paused, mutationContext(principal, idempotencyKey, 'system.global_pause')));
        }
        return response(404, { error: 'not_found' });
      } catch (error) {
        if (error instanceof StudioAuthorizationError || error instanceof StudioConflictError) {
          return response(error.status, { error: error.code, detail: error.message });
        }
        return response(400, { error: 'invalid_request', detail: error.message });
      }
    },
  };
}
