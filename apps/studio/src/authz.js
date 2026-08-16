const ACCOUNT_TYPES = new Set(['personal', 'organization']);
const ACCOUNT_ROLES = new Set(['viewer', 'editor', 'account_admin']);

export class StudioAuthorizationError extends Error {
  constructor(message, status = 403, code = 'forbidden') {
    super(message);
    this.name = 'StudioAuthorizationError';
    this.status = status;
    this.code = code;
  }
}

function validIdentifier(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(value);
}

export function validatePrincipal(principal) {
  if (!principal || typeof principal !== 'object') {
    throw new StudioAuthorizationError('An authenticated principal is required.', 401, 'principal_required');
  }
  if (!validIdentifier(principal.subjectId)) {
    throw new StudioAuthorizationError('The trusted principal has an invalid subject.', 401, 'principal_invalid');
  }
  if (!principal.account || !ACCOUNT_TYPES.has(principal.account.type) || !validIdentifier(principal.account.id)) {
    throw new StudioAuthorizationError('The trusted principal has an invalid account scope.', 401, 'principal_invalid');
  }
  if (!Array.isArray(principal.accountRoles) || principal.accountRoles.some((role) => !ACCOUNT_ROLES.has(role))) {
    throw new StudioAuthorizationError('The trusted principal has invalid account roles.', 401, 'principal_invalid');
  }
  if (!Array.isArray(principal.systemRoles) || principal.systemRoles.some((role) => role !== 'operator')) {
    throw new StudioAuthorizationError('The trusted principal has invalid system roles.', 401, 'principal_invalid');
  }
  return principal;
}

export function accountScope(principal) {
  const trusted = validatePrincipal(principal);
  return Object.freeze({ type: trusted.account.type, id: trusted.account.id });
}

export function scopeKey(scope) {
  if (!scope || !ACCOUNT_TYPES.has(scope.type) || !validIdentifier(scope.id)) {
    throw new TypeError('A valid personal or organization scope is required.');
  }
  return `${scope.type}:${scope.id}`;
}

export function requireCapability(principal, capability) {
  const trusted = validatePrincipal(principal);
  const roles = new Set(trusted.accountRoles);
  if (capability === 'account:read' && (roles.has('viewer') || roles.has('editor') || roles.has('account_admin'))) return trusted;
  if (capability === 'account:write' && (roles.has('editor') || roles.has('account_admin'))) return trusted;
  if (capability === 'system:pause' && trusted.systemRoles.includes('operator')) return trusted;
  throw new StudioAuthorizationError(`Capability ${capability} is required.`);
}

export function capabilitiesFor(principal) {
  const trusted = validatePrincipal(principal);
  const capabilities = [];
  for (const capability of ['account:read', 'account:write', 'system:pause']) {
    try {
      requireCapability(trusted, capability);
      capabilities.push(capability);
    } catch {
      // Capability omission is the public authorization result.
    }
  }
  return capabilities;
}
