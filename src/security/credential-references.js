const REFERENCE_SCHEMES = new Set(['env', 'vault', 'aws-sm', 'gcp-sm', 'azure-kv']);
const FORBIDDEN_KEY = /(?:password|passphrase|secret|token|api[_-]?key|authorization|cookie|private[_-]?key|client[_-]?secret)/i;
const FORBIDDEN_OBJECT_KEY = new Set(['__proto__', 'prototype', 'constructor']);
const APPARENT_SECRET = /(?:\bBearer\s+[A-Za-z0-9._~+/=-]{6,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\bsk-[A-Za-z0-9_-]{8,})/i;
const MAX_REFERENCE_LENGTH = 220;

function fail(message) {
  throw new TypeError(`Invalid credential boundary: ${message}`);
}

function parseReference(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > MAX_REFERENCE_LENGTH) {
    fail('credential_ref must be a bounded opaque reference.');
  }
  if (/\s|[?#]/.test(value)) fail('credential_ref must not contain whitespace, query parameters, or fragments.');

  const separator = value.indexOf('://');
  if (separator < 1) fail('credential_ref must use an approved reference scheme.');
  const scheme = value.slice(0, separator);
  const location = value.slice(separator + 3);
  if (!REFERENCE_SCHEMES.has(scheme)) fail('credential_ref must use an approved reference scheme.');
  if (!location || location.startsWith('/') || location.endsWith('/') || location.includes('..')) {
    fail('credential_ref must contain a normalized opaque location.');
  }

  if (scheme === 'env') {
    if (!/^[A-Z][A-Z0-9_]{2,127}$/.test(location)) {
      fail('env references must name an uppercase environment variable.');
    }
  } else if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{1,199}$/.test(location)) {
    fail('credential_ref contains unsupported characters.');
  }
  return { scheme, location };
}

export function validateCredentialRef(value) {
  parseReference(value);
  return value;
}

export function redactCredentialRef(value) {
  const { scheme } = parseReference(value);
  return `${scheme}://[redacted]`;
}

export function credentialReferenceSummary(value) {
  const { scheme } = parseReference(value);
  return Object.freeze({
    credential_configured: true,
    credential_scheme: scheme,
    credential_ref: `${scheme}://[redacted]`,
  });
}

export function assertNoCredentialMaterial(value, options = {}) {
  const maxDepth = options.maxDepth ?? 12;
  const maxNodes = options.maxNodes ?? 2_000;
  const seen = new Set();
  let nodes = 0;

  function visit(current, path, depth) {
    nodes += 1;
    if (nodes > maxNodes) fail('input is too large to inspect safely.');
    if (depth > maxDepth) fail('input is too deeply nested to inspect safely.');
    if (typeof current === 'string') {
      if (current.length > 16_384) fail(`${path} is too long.`);
      if (APPARENT_SECRET.test(current)) fail(`${path} appears to contain credential material.`);
      return;
    }
    if (current === null || typeof current !== 'object') return;
    if (seen.has(current)) fail(`${path} must not contain circular references.`);
    seen.add(current);

    for (const key of Object.getOwnPropertyNames(current)) {
      const childPath = Array.isArray(current) ? `${path}[${key}]` : `${path}.${key}`;
      if (!Array.isArray(current) && FORBIDDEN_OBJECT_KEY.has(key)) {
        fail(`${childPath} is not accepted.`);
      }
      const nested = current[key];
      if (!Array.isArray(current) && key === 'credential_ref') {
        validateCredentialRef(nested);
        continue;
      }
      if (!Array.isArray(current) && FORBIDDEN_KEY.test(key)) {
        fail(`${childPath} is secret-like; provide credential_ref instead.`);
      }
      visit(nested, childPath, depth + 1);
    }
    seen.delete(current);
  }

  visit(value, 'value', 0);
  return true;
}

export const APPROVED_CREDENTIAL_REFERENCE_SCHEMES = Object.freeze([...REFERENCE_SCHEMES]);
