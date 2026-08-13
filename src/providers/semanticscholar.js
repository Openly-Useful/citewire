// src/providers/semanticscholar.js
//
// Queries: the Semantic Scholar Academic Graph paper-search endpoint.
// Free-access basis: most Graph API endpoints are usable without a key through
// a shared unauthenticated request pool. The API license governs its data;
// each paper's full-text rights vary and are not granted here.
// Enabling this provider is the deployer's own act. Reachability is not
// permission: the deployer must review Semantic Scholar's terms before turning
// it on.

import { fetchJson, buildUrl, toolJson, toolError, clampLimit } from './util.js';

const ENDPOINT = 'https://api.semanticscholar.org/graph/v1/paper/search';
const FIELDS = 'title,abstract,year,url,citationCount,authors';
const ATTRIBUTION = Object.freeze({
  name: 'Semantic Scholar',
  url: 'https://www.semanticscholar.org/',
});
const CITATION = `${ATTRIBUTION.name}: ${ATTRIBUTION.url}`;
const ABSTRACT_EXCERPT_CHARS = 400;

export const key = 'semanticscholar';
export const title = 'Semantic Scholar (academic graph search)';
export const docsUrl = 'https://api.semanticscholar.org/api-docs/graph';
export const termsNote =
  'API license applies; paper full-text rights vary. Unauthenticated traffic shares a 1000 req/sec pool and may be further throttled; new API keys start at 1 req/sec.';

export function tools(config) {
  return [
    {
      name: 'semanticscholar.search',
      description:
        'Search papers in the Semantic Scholar Academic Graph. Returns title, abstract, year, url, citation count and authors.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-text paper search.' },
          limit: { type: 'integer', description: 'Max results (1-25, default 10).' },
        },
        required: ['query'],
      },
      handler: async (args) => {
        const query = args && args.query;
        if (!query || typeof query !== 'string') return toolError('query is required');
        const limit = clampLimit(args && args.limit);
        const url = buildUrl(ENDPOINT, { query, limit, fields: FIELDS });
        const data = await fetchJson(url, { fetchImpl: config && config.fetch });
        const results = Array.isArray(data && data.data) ? data.data : [];
        const items = results.slice(0, limit).map((p) => ({
          title: p.title,
          abstract:
            typeof p.abstract === 'string' && p.abstract.length > ABSTRACT_EXCERPT_CHARS
              ? p.abstract.slice(0, ABSTRACT_EXCERPT_CHARS)
              : p.abstract,
          abstract_truncated:
            typeof p.abstract === 'string' && p.abstract.length > ABSTRACT_EXCERPT_CHARS,
          year: p.year,
          url: p.url,
          citationCount: p.citationCount,
          authors: Array.isArray(p.authors) ? p.authors.map((a) => a.name) : [],
        }));
        return toolJson(
          {
            provider: key,
            query,
            count: items.length,
            items,
            attribution: ATTRIBUTION,
            citation: CITATION,
            termsNote,
          },
          ATTRIBUTION,
        );
      },
    },
  ];
}

export default { key, title, docsUrl, termsNote, tools };
