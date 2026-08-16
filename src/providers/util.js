// src/providers/util.js — shared helpers for every provider module.
//
// These are deliberately local copies of the core's result shapes rather than
// imports from src/core. The providers are written in parallel to the core and
// must not depend on it at authoring time; keeping the tiny helpers here lets
// each provider module stand alone. The shapes are identical to the core's
// toolJson / toolError so results drop straight onto the MCP wire.

const PROJECT_URL = 'https://github.com/Openly-Useful/citewire';

export function citewireUserAgent(mailto) {
  const contact = mailto ? `; mailto:${mailto}` : '';
  return `citewire/0.2.0 (+${PROJECT_URL}${contact})`;
}

const USER_AGENT = citewireUserAgent();

// A successful tool result. structuredContent carries the machine-readable
// payload; content mirrors it as text for clients that only read text blocks.
export function toolJson(payload, textAttribution) {
  const content = [{ type: 'text', text: JSON.stringify(payload) }];
  if (textAttribution) {
    content.push({
      type: 'text',
      text: `Attribution: ${textAttribution.name} (${textAttribution.url})`,
    });
  }
  return {
    content,
    structuredContent: payload,
    isError: false,
  };
}

// A tool-level failure the agent caller can read and recover from. Never a
// protocol error.
export function toolError(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

// Clamp a caller-supplied limit into [1, max] with a default. Every tool caps
// its own result size so responses stay agent-sized.
export function clampLimit(limit, def = 10, max = 25) {
  const n = Number(limit);
  if (!Number.isFinite(n)) return def;
  return Math.max(1, Math.min(max, Math.floor(n)));
}

// Fetch a URL and parse JSON. Uses a config-injected fetch when provided (for
// testability), otherwise the built-in global fetch. Sets the citewire
// User-Agent, enforces an AbortController timeout, and throws on non-2xx with
// the status in the message.
export async function fetchJson(url, { fetchImpl, timeoutMs = 15000, headers } = {}) {
  const text = await fetchText(url, { fetchImpl, timeoutMs, headers });
  return JSON.parse(text);
}

// Fetch a URL and return the raw response body as text. Same policy as
// fetchJson; used by providers whose responses are not JSON (e.g. arXiv Atom).
export async function fetchText(url, { fetchImpl, timeoutMs = 15000, headers } = {}) {
  const doFetch = fetchImpl || globalThis.fetch;
  if (typeof doFetch !== 'function') {
    throw new Error('no fetch implementation available (Node >= 18 required)');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await doFetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, ...(headers || {}) },
    });
    if (!res.ok) {
      const retryAfter = res.headers?.get?.('retry-after');
      const retryNote = retryAfter ? `; retry after ${retryAfter}` : '';
      throw new Error(
        `request failed: ${res.status} ${res.statusText || ''}${retryNote}`.trim(),
      );
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// Build a URL with query params, dropping null/undefined values.
export function buildUrl(base, params) {
  const u = new URL(base);
  for (const [k, v] of Object.entries(params || {})) {
    if (v === null || v === undefined) continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}
