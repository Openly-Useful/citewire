// src/providers/crossref.js
//
// Queries: the Crossref /works REST endpoint — bibliographic metadata for
// registered scholarly DOIs.
// Free-access basis: Crossref's public API is free and keyless. It asks
// callers to identify themselves politely, which citewire does via User-Agent.
// Enabling this provider is the deployer's own act. Reachability is not
// permission: the deployer must review Crossref's terms before turning it on.

import {
  fetchJson,
  buildUrl,
  toolJson,
  toolError,
  clampLimit,
  citewireUserAgent,
} from './util.js';

const ENDPOINT = 'https://api.crossref.org/works';

export const key = 'crossref';
export const title = 'Crossref (DOI metadata search)';
export const docsUrl = 'https://api.crossref.org/';
export const termsNote =
  'Bibliographic metadata is public. A deployer-supplied mailto contact identifies citewire to the Crossref polite pool; abstracts remain third-party content.';

function validMailto(value) {
  return (
    typeof value === 'string' &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

function joinDateParts(dateObj) {
  const parts =
    dateObj && Array.isArray(dateObj['date-parts']) ? dateObj['date-parts'][0] : null;
  if (!Array.isArray(parts)) return null;
  return parts.join('-');
}

export function tools(config) {
  return [
    {
      name: 'crossref.search',
      description:
        'Search Crossref bibliographic metadata. Returns DOI, title, published date, container title and URL.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-text bibliographic query.' },
          limit: { type: 'integer', description: 'Max results (1-25, default 10).' },
        },
        required: ['query'],
      },
      handler: async (args) => {
        const query = args && args.query;
        if (!query || typeof query !== 'string') return toolError('query is required');
        const mailto = config?.providers?.crossref?.mailto;
        if (!validMailto(mailto)) {
          return toolError(
            'providers.crossref.mailto must be a valid deployer contact email before Crossref can be queried',
          );
        }
        const limit = clampLimit(args && args.limit);
        const url = buildUrl(ENDPOINT, { query, rows: limit, mailto });
        const data = await fetchJson(url, {
          fetchImpl: config && config.fetch,
          headers: { 'User-Agent': citewireUserAgent(mailto) },
        });
        const items = (data && data.message && Array.isArray(data.message.items)
          ? data.message.items
          : []
        )
          .slice(0, limit)
          .map((it) => ({
            DOI: it.DOI,
            title: Array.isArray(it.title) ? it.title[0] : it.title,
            published: joinDateParts(it.published || it['published-print'] || it['published-online']),
            container: Array.isArray(it['container-title']) ? it['container-title'][0] : null,
            URL: it.URL,
          }));
        return toolJson({ provider: key, query, count: items.length, items, termsNote });
      },
    },
  ];
}

export default { key, title, docsUrl, termsNote, tools };
