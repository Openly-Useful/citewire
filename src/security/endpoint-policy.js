import { isIP } from 'node:net';

function fail(message) {
  throw new TypeError(`Invalid connector endpoint: ${message}`);
}

function parseHttpsUrl(value, label) {
  if (typeof value !== 'string' || value.length > 2_048) fail(`${label} must be a bounded URL string.`);
  if (/%2e|\/\.\.?\//i.test(value)) fail(`${label} must not contain path traversal segments.`);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${label} must be an absolute URL.`);
  }
  if (parsed.protocol !== 'https:') fail(`${label} must use HTTPS.`);
  if (parsed.username || parsed.password) fail(`${label} must not contain user information.`);
  if (parsed.hash) fail(`${label} must not contain a fragment.`);
  if (parsed.search) fail(`${label} must not contain query parameters.`);
  if (parsed.port && parsed.port !== '443') fail(`${label} must not use a non-default port.`);

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!hostname || hostname.endsWith('.') || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    fail(`${label} hostname is not allowed.`);
  }
  if (isIP(hostname) !== 0) fail(`${label} must not use an IP literal.`);
  if (hostname.startsWith('xn--') || hostname.includes('.xn--')) fail(`${label} must not use an internationalized hostname.`);
  return parsed;
}

function normalizedOrigin(value) {
  const parsed = parseHttpsUrl(value, 'allowed origin');
  if (parsed.pathname !== '/' || parsed.search || parsed.hash) fail('allowed origin must contain only an origin.');
  return parsed.origin;
}

export function validateConnectorEndpoint(value, { allowedOrigins = [] } = {}) {
  if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) {
    fail('no reviewed allowed_origins are available; use an endpointless connector.');
  }
  const parsed = parseHttpsUrl(value, 'endpoint');
  const reviewed = new Set(allowedOrigins.map(normalizedOrigin));
  if (!reviewed.has(parsed.origin)) fail('endpoint origin is not present in the reviewed source policy.');
  return parsed.href;
}

export function assertEndpointlessConnector(connector, source) {
  if (Object.hasOwn(connector, 'endpoint') || Object.hasOwn(connector, 'url')) {
    const allowedOrigins = source?.connector_policy?.allowed_origins;
    validateConnectorEndpoint(connector.endpoint ?? connector.url, { allowedOrigins });
  }
  if (!source?.connector_policy?.allowed_origins) return true;
  return true;
}
