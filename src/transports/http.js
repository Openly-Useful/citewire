// MCP Streamable HTTP transport (stateless JSON-RPC 2.0 over POST).
//
// Same semantics as the production Vercel function: POST only, no sessions, no
// SSE. Works both as a serverless handler (runtime pre-parses req.body) and on
// a plain node:http server (we collect the body chunks ourselves).

const PROTOCOL_VERSION = '2025-06-18';
const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

function sendJsonError(res, statusCode, code, message) {
  res.setHeader('Content-Type', JSON_CONTENT_TYPE);
  res.statusCode = statusCode;
  res.end(JSON.stringify(rpcError(null, code, message)));
}

function getHeader(req, name) {
  const headers = req.headers || {};
  const lowerName = name.toLowerCase();
  if (headers[lowerName] !== undefined) return headers[lowerName];
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) return value;
  }
  return undefined;
}

function firstHeaderValue(value) {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== 'string') return undefined;
  const trimmed = first.split(',')[0].trim();
  return trimmed || undefined;
}

function parseOrigin(value) {
  if (typeof value !== 'string' || value.trim() !== value || value === 'null') return undefined;
  try {
    const url = new URL(value);
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      return undefined;
    }
    return url;
  } catch {
    return undefined;
  }
}

function isLoopbackHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '[::1]';
}

function requestOrigin(req) {
  const host = firstHeaderValue(getHeader(req, 'x-forwarded-host')) || firstHeaderValue(getHeader(req, 'host'));
  if (!host) return undefined;

  const forwardedProtocol = firstHeaderValue(getHeader(req, 'x-forwarded-proto'));
  const protocol = (forwardedProtocol || (req.socket?.encrypted || req.connection?.encrypted ? 'https' : 'http')).toLowerCase();
  if (protocol !== 'http' && protocol !== 'https') return undefined;

  return parseOrigin(`${protocol}://${host}`)?.origin;
}

function normalizeAllowedOrigins(allowedOrigins) {
  if (allowedOrigins === undefined) return undefined;
  if (!Array.isArray(allowedOrigins)) throw new TypeError('allowedOrigins must be an array of HTTP(S) origins.');
  return new Set(
    allowedOrigins.map((origin) => {
      const parsed = parseOrigin(origin);
      if (!parsed) throw new TypeError(`Invalid allowed origin: ${String(origin)}`);
      return parsed.origin;
    }),
  );
}

function originIsAllowed(req, allowedOrigins, local) {
  const value = getHeader(req, 'origin');
  // Non-browser MCP clients normally omit Origin. A present Origin is always
  // validated, which is the DNS-rebinding boundary the transport requires.
  if (value === undefined) return true;
  if (Array.isArray(value)) return false;

  const origin = parseOrigin(value);
  if (!origin) return false;
  if (allowedOrigins) return allowedOrigins.has(origin.origin);
  if (local) return isLoopbackHostname(origin.hostname);
  return origin.origin === requestOrigin(req);
}

function acceptedMediaType(header, expected) {
  if (typeof header !== 'string') return false;
  return header.split(',').some((entry) => {
    const [mediaType, ...parameters] = entry.split(';').map((part) => part.trim().toLowerCase());
    if (mediaType !== expected) return false;
    const quality = parameters.find((part) => part.startsWith('q='));
    return quality === undefined || Number(quality.slice(2)) > 0;
  });
}

function isJsonContentType(header) {
  if (typeof header !== 'string') return false;
  return header.split(';', 1)[0].trim().toLowerCase() === 'application/json';
}

// Collect a request body as a string. Used only when the runtime did not
// pre-parse req.body (plain node:http). Resolves '' for an empty body.
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Build the async (req, res) handler. Shared by serverless exports and runHttp.
// Remote deployments may pass an exact allowedOrigins array for cross-origin
// browser clients. Without one, a present Origin must match the effective
// request origin, including x-forwarded-host/proto behind a trusted proxy.
export function createHttpHandler(server, { allowedOrigins, local = false } = {}) {
  const originAllowlist = normalizeAllowedOrigins(allowedOrigins);

  return async function handler(req, res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    if (!originIsAllowed(req, originAllowlist, local)) {
      sendJsonError(res, 403, -32000, 'Forbidden: invalid Origin header.');
      return;
    }

    if (req.method !== 'POST') {
      // No event stream is offered; the spec permits 405 for other methods.
      res.setHeader('Allow', 'POST');
      sendJsonError(res, 405, -32600, 'POST only; this server offers no event stream.');
      return;
    }

    const accept = getHeader(req, 'accept');
    if (!acceptedMediaType(accept, 'application/json') || !acceptedMediaType(accept, 'text/event-stream')) {
      sendJsonError(res, 406, -32000, 'Not Acceptable: client must accept application/json and text/event-stream.');
      return;
    }

    if (!isJsonContentType(getHeader(req, 'content-type'))) {
      sendJsonError(res, 415, -32000, 'Unsupported Media Type: Content-Type must be application/json.');
      return;
    }

    const requestedVersion = getHeader(req, 'mcp-protocol-version');
    if (requestedVersion !== undefined && requestedVersion !== PROTOCOL_VERSION) {
      sendJsonError(res, 400, -32600, `Unsupported MCP-Protocol-Version: ${String(requestedVersion)}.`);
      return;
    }

    // Body may arrive pre-parsed (serverless) as an object, as a JSON string,
    // or not at all (plain node:http) — in which case we read the stream.
    let message = req.body;
    if (message === undefined) {
      const raw = await readBody(req);
      message = raw === '' ? undefined : raw;
    }
    if (typeof message === 'string') {
      try {
        message = JSON.parse(message);
      } catch {
        sendJsonError(res, 400, -32700, 'Body is not valid JSON.');
        return;
      }
    }
    if (message == null) {
      sendJsonError(res, 400, -32700, 'Body is not valid JSON.');
      return;
    }

    const isNotification =
      !Array.isArray(message) &&
      typeof message === 'object' &&
      message.jsonrpc === '2.0' &&
      typeof message.method === 'string' &&
      message.id === undefined;
    const response = await server.handle(message);
    if (isNotification) {
      // MCP 2025-06-18 requires 202 with no body for an accepted notification.
      // Classify it here because a transport-agnostic dispatcher may still
      // compute a result for a recognized method that omitted its id.
      res.statusCode = 202;
      res.end();
      return;
    }
    if (response === undefined) {
      res.setHeader('Content-Type', JSON_CONTENT_TYPE);
      res.statusCode = 200;
      res.end(JSON.stringify(rpcError(message?.id, -32603, 'Internal error: request produced no response.')));
      return;
    }
    res.setHeader('Content-Type', JSON_CONTENT_TYPE);
    res.statusCode = 200;
    res.end(JSON.stringify(response));
  };
}

// Start a node:http server routing every path to the MCP handler.
export async function runHttp(server, { port = 8722 } = {}) {
  const http = await import('node:http');
  const host = '127.0.0.1';
  const handler = createHttpHandler(server, { local: true });
  const httpServer = http.createServer((req, res) => {
    // Errors must never crash the process; surface them as a 500 to stderr.
    Promise.resolve(handler(req, res)).catch((err) => {
      process.stderr.write(`citewire http: handler error: ${err && err.stack ? err.stack : err}\n`);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.statusCode = 500;
        res.end(JSON.stringify(rpcError(null, -32603, 'Internal error.')));
      } else if (!res.writableEnded) {
        res.end();
      }
    });
  });

  await new Promise((resolve) => {
    httpServer.listen(port, host, () => {
      const addr = httpServer.address();
      const shown = addr && typeof addr === 'object' ? `http://${host}:${addr.port}/` : String(addr);
      process.stderr.write(`citewire: MCP HTTP transport listening on ${shown}\n`);
      resolve();
    });
  });

  return httpServer;
}
