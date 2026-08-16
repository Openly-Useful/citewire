// src/platform/tools.js — config-driven news-platform tools over HTTP.
//
// This is what makes citewire generic: any site that exposes a compatible
// read API (the karaya.group /api/v1/news surface in contracts/openapi.news.yaml)
// plugs in by declaring config.platform. The four tools here are a mechanical
// projection of that HTTP surface, so the MCP tools cannot drift from the API
// they wrap: same list filters, same slug lookup, same topics feed.
//
// Every outbound request carries a descriptive User-Agent, a 15s abort
// timeout, and maps non-2xx responses to a readable tool error using the
// RFC7807 problem body's `detail` when the response parses as one.

import { toolJson, toolError } from '../core/rpc.js';

const USER_AGENT = 'citewire/0.2.0 (+https://github.com/Openly-Useful/citewire)';
const TIMEOUT_MS = 15000;
const READ_ONLY_EXTERNAL = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
});
const READ_ONLY_LOCAL = Object.freeze({ ...READ_ONLY_EXTERNAL, openWorldHint: false });

// Perform one GET and return { ok, status, body } or throw on transport error.
async function getJson(url, doFetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await doFetch(url, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null; // non-JSON or empty body
    }
    return { ok: res.ok, status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

// Map a non-2xx response to a tool error, preferring the problem body detail.
function httpError(status, body) {
  const detail =
    body && typeof body === 'object' && typeof body.detail === 'string' ? body.detail : null;
  return toolError(`upstream_error: ${status}${detail ? ` ${detail}` : ''}`);
}

// Run a GET and either return its JSON as a tool result or a mapped tool error.
async function requestTool(url, doFetch) {
  let res;
  try {
    res = await getJson(url, doFetch);
  } catch (err) {
    const message = err && err.name === 'AbortError' ? 'request timed out' : err && err.message ? err.message : String(err);
    return toolError(`upstream_error: ${message}`);
  }
  if (!res.ok) return httpError(res.status, res.body);
  return toolJson(res.body);
}

// Build a query string from only the provided (non-undefined, non-null) args.
function buildQuery(args, keys) {
  const params = new URLSearchParams();
  for (const key of keys) {
    const value = args[key];
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function platformTools(config) {
  const platform = config && config.platform;
  if (!platform) return [];

  const { name, siteUrl, apiBase } = platform;
  const doFetch = (config && config.fetch) || globalThis.fetch;

  return [
    {
      name: 'news.list',
      title: 'List published news',
      description:
        'List published news items, newest first. Filters mirror the platform API: ' +
        'topic and industry taxonomy slugs, free-text search, a days window, and ' +
        'keyset cursor pagination.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic slug (see news.topics)' },
          industry: { type: 'string', description: 'Industry slug' },
          q: { type: 'string', description: 'Free-text search' },
          days: { type: 'integer', enum: [1, 7, 30], description: 'Posted-within window in days' },
          cursor: { type: 'string', description: 'Opaque next_cursor from a previous call' },
          page_size: { type: 'integer', minimum: 1, maximum: 50, description: 'Items per page (max 50)' },
        },
        additionalProperties: false,
      },
      annotations: READ_ONLY_EXTERNAL,
      handler: async (args) => {
        const qs = buildQuery(args, ['topic', 'industry', 'q', 'days', 'cursor', 'page_size']);
        return requestTool(`${apiBase}${qs}`, doFetch);
      },
    },
    {
      name: 'news.get',
      title: 'Get a published news item',
      description: 'One published news item by slug, with attribution and related coverage.',
      inputSchema: {
        type: 'object',
        properties: { slug: { type: 'string', description: 'Item slug from news.list' } },
        required: ['slug'],
        additionalProperties: false,
      },
      annotations: READ_ONLY_EXTERNAL,
      handler: async (args) => {
        const slug = String((args && args.slug) || '');
        if (!slug) return toolError('invalid_request: slug is required.');
        return requestTool(`${apiBase}/${encodeURIComponent(slug)}`, doFetch);
      },
    },
    {
      name: 'news.topics',
      title: 'List news topics',
      description: 'The active news taxonomy topics (slug, label, description).',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: READ_ONLY_EXTERNAL,
      handler: async () => requestTool(`${apiBase}/topics`, doFetch),
    },
    {
      name: 'news.about',
      title: 'Describe the news platform',
      description:
        'Static facts about this server and the platform: attribution policy, site, and API base.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: READ_ONLY_LOCAL,
      handler: async () =>
        toolJson({
          server: { name: 'citewire', version: '0.2.0' },
          platform: { name, site: siteUrl, api_base: apiBase },
          attribution_policy:
            'Every item credits its original publisher and links to the original article. ' +
            'Source rights remain with their publishers.',
        }),
    },
  ];
}
