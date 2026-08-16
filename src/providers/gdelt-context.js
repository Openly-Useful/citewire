// src/providers/gdelt-context.js
//
// Queries: the GDELT Context 2.0 API — snippet-level context matches around a
// search term across the global news index.
// Free-access basis: open-data GDELT endpoint, no key required; returns
// snippet metadata and source URLs only.
// Enabling this provider is the deployer's own act. Reachability is not
// permission: the deployer must review GDELT's terms before turning it on.

import { fetchJson, buildUrl, toolJson, toolError, clampLimit } from './util.js';

const ENDPOINT = 'https://api.gdeltproject.org/api/v2/context/context';
const ATTRIBUTION = Object.freeze({
  name: 'GDELT Project',
  url: 'https://www.gdeltproject.org/',
});
const CITATION = `${ATTRIBUTION.name}: ${ATTRIBUTION.url}`;

export const key = 'gdelt-context';
export const title = 'GDELT Context 2.0 (news snippet context)';
export const docsUrl = 'https://blog.gdeltproject.org/announcing-the-gdelt-context-2-0-api/';
export const termsNote =
  'Open-data service; article rights remain with their publishers. Metadata and URLs only.';

export function tools(config) {
  return [
    {
      name: 'gdelt.context',
      description:
        'Retrieve snippet-level context matches for a query from the GDELT Context 2.0 API. Returns the surrounding text snippet plus source metadata.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (GDELT query syntax).' },
          limit: { type: 'integer', description: 'Max matches (1-25, default 10).' },
        },
        required: ['query'],
      },
      handler: async (args) => {
        const query = args && args.query;
        if (!query || typeof query !== 'string') return toolError('query is required');
        const limit = clampLimit(args && args.limit);
        const url = buildUrl(ENDPOINT, { query, format: 'json' });
        const data = await fetchJson(url, { fetchImpl: config && config.fetch });
        // Context API returns { articles: [ { url, title, domain, ... snippet fields } ] }
        const matches = Array.isArray(data && data.articles) ? data.articles : [];
        const items = matches.slice(0, limit);
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
