import { validateSourcePolicy } from './registry.js';

const ACCESS_MODES = new Set(['public', 'personal_credential', 'organization_credential']);
const USE_CASES = new Set(['personal_research', 'organization_internal', 'public_brief', 'republication']);
const OPERATIONS = new Set(['metadata', 'excerpt', 'summary', 'republication']);
const CREDENTIAL_REFERENCE = /^(?:vault|env|aws-sm|gcp-sm|azure-kv):\/\/[a-zA-Z0-9][a-zA-Z0-9:./_-]{1,180}$/;

function hasValidReference(value) {
  return typeof value === 'string' && CREDENTIAL_REFERENCE.test(value);
}

export function evaluateRights({ source, accessMode, credentialRef, useCase, operation } = {}) {
  const reasons = [];
  let validatedSource = null;
  if (!source || typeof source !== 'object') {
    reasons.push('SOURCE_POLICY_MISSING');
  } else {
    try {
      validatedSource = validateSourcePolicy(source);
    } catch {
      reasons.push('SOURCE_POLICY_INVALID');
    }
  }
  if (!ACCESS_MODES.has(accessMode)) reasons.push('ACCESS_MODE_UNKNOWN');
  if (!USE_CASES.has(useCase)) reasons.push('USE_CASE_UNKNOWN');
  if (!OPERATIONS.has(operation)) reasons.push('OPERATION_UNKNOWN');

  const referenceProvided = credentialRef !== undefined;
  const referenceValid = hasValidReference(credentialRef);
  if (accessMode === 'public' && referenceProvided) reasons.push('CREDENTIAL_REFERENCE_UNEXPECTED');
  if (accessMode !== undefined && accessMode !== 'public' && !referenceProvided) {
    reasons.push('CREDENTIAL_REFERENCE_REQUIRED');
  } else if (referenceProvided && !referenceValid) {
    reasons.push('CREDENTIAL_REFERENCE_INVALID');
  }

  if (validatedSource?.rights) {
    if (!validatedSource.rights.access_modes.includes(accessMode)) {
      reasons.push('ACCESS_MODE_NOT_ALLOWED');
    }
    const allowed = USE_CASES.has(useCase)
      ? validatedSource.rights.allowed_operations[useCase] || []
      : [];
    if (!allowed.includes(operation)) reasons.push('USE_NOT_ALLOWED');
  }

  const allowed = reasons.length === 0;
  return {
    allowed,
    decision: allowed ? 'allow' : 'hold',
    reasons,
    source_id: typeof validatedSource?.id === 'string' ? validatedSource.id : null,
    access_mode: ACCESS_MODES.has(accessMode) ? accessMode : null,
    credential_reference_present: referenceValid,
    use_case: USE_CASES.has(useCase) ? useCase : null,
    operation: OPERATIONS.has(operation) ? operation : null,
    policy_notice: typeof validatedSource?.rights?.notice === 'string'
      ? validatedSource.rights.notice
      : 'No source policy is available. Hold by default.',
    safeguards: [
      'No paywall or access-control bypass.',
      'Credentials grant access only within the account or organization terms.',
      'Access does not grant redistribution rights.',
    ],
  };
}
