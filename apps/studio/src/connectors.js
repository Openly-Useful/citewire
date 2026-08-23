import { getSource } from '../../../src/community/registry.js';
import { assertNoCredentialMaterial, credentialReferenceSummary, validateCredentialRef } from '../../../src/security/credential-references.js';
import { assertEndpointlessConnector } from '../../../src/security/endpoint-policy.js';

const ACCESS_MODES = new Set(['public', 'personal_credential', 'organization_credential']);
const CONNECTOR_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const ALLOWED_KEYS = new Set(['id', 'source_id', 'access_mode', 'credential_ref', 'activation_state', 'endpoint']);

export function validateConnectorDefinition(input, registry) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Connector definition must be an object.');
  assertNoCredentialMaterial(input);
  for (const key of Object.keys(input)) {
    if (!ALLOWED_KEYS.has(key)) throw new TypeError(`Connector field ${key} is not supported.`);
  }
  if (!CONNECTOR_ID.test(input.id ?? '')) throw new TypeError('Connector id is invalid.');
  const source = getSource(registry, input.source_id);
  if (!source) throw new TypeError('Connector source_id is not in the reviewed registry.');
  if (!source.adapter) throw new TypeError('Connector source does not have a reviewed adapter.');
  if (!ACCESS_MODES.has(input.access_mode)) throw new TypeError('Connector access_mode is invalid.');
  if (!source.rights.access_modes.includes(input.access_mode)) throw new TypeError('Connector access_mode is not allowed by source policy.');
  if (input.activation_state !== undefined && input.activation_state !== 'disabled') {
    throw new TypeError('Connectors remain disabled in this phase.');
  }
  if (input.access_mode === 'public') {
    if (input.credential_ref !== undefined) throw new TypeError('Public connectors must not include a credential reference.');
  } else {
    validateCredentialRef(input.credential_ref);
  }
  assertEndpointlessConnector(input, source);
  return structuredClone({
    id: input.id,
    source_id: source.id,
    adapter_id: source.adapter,
    access_mode: input.access_mode,
    ...(input.credential_ref ? { credential_ref: input.credential_ref } : {}),
    activation_state: 'disabled',
    external_calls: false,
  });
}

export function serializeConnector(connector) {
  const output = {
    id: connector.id,
    source_id: connector.source_id,
    adapter_id: connector.adapter_id,
    access_mode: connector.access_mode,
    activation_state: 'disabled',
    external_calls: false,
    credential_configured: false,
  };
  if (connector.credential_ref) Object.assign(output, credentialReferenceSummary(connector.credential_ref));
  return output;
}
