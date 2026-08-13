// src/providers/openalex.js
//
// Queries: the OpenAlex /works endpoint — a fully open index of scholarly
// works (papers, datasets, etc.) and their metadata.
// Free-access basis: OpenAlex has a metered daily allowance; this adapter is
// keyless and therefore cannot incur paid usage; it stops when the keyless
// allowance is exhausted. Its core metadata is CC0.
// Full text of the underlying works keeps its own license.
// Enabling this provider is the deployer's own act. Reachability is not
// permission: the deployer must review OpenAlex's terms before turning it on.

import { fetchJson, buildUrl, toolJson, toolError, clampLimit } from './util.js';

const ENDPOINT = 'https://api.openalex.org/works';

export const key = 'openalex';
export const title = 'OpenAlex (scholarly works search)';
export const docsUrl = 'https://docs.openalex.org/';
export const termsNote =
  'Core metadata is CC0; underlying full text keeps its own license. This keyless adapter cannot incur charges and stops at the keyless allowance.';

export function tools(config) {
  return [
    {
      name: 'openalex.search',
      description:
        'Search scholarly works in OpenAlex. Returns id, title, publication date, DOI, open-access URL and citation count.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-text search across works.' },
          limit: { type: 'integer', description: 'Max results (1-25, default 10).' },
        },
        required: ['query'],
      },
      handler: async (args) => {
        const query = args && args.query;
        if (!query || typeof query !== 'string') return toolError('query is required');
        const limit = clampLimit(args && args.limit);
        const url = buildUrl(ENDPOINT, { search: query, 'per-page': limit });
        const data = await fetchJson(url, { fetchImpl: config && config.fetch });
        const results = Array.isArray(data && data.results) ? data.results : [];
        const items = results.slice(0, limit).map((w) => ({
          id: w.id,
          title: w.title,
          publication_date: w.publication_date,
          doi: w.doi,
          open_access: w.open_access ? w.open_access.oa_url : null,
          cited_by_count: w.cited_by_count,
        }));
        return toolJson({ provider: key, query, count: items.length, items, termsNote });
      },
    },
  ];
}

export default { key, title, docsUrl, termsNote, tools };
