// src/providers/gdelt-doc.js
//
// Queries: the GDELT 2.0 DOC API (Article List mode) — a global index of
// online news article metadata.
// Free-access basis: GDELT is an open-data project; this endpoint needs no key
// and returns article metadata and URLs only, never full text.
// Enabling this provider is the deployer's own act. Reachability is not
// permission: the deployer must review GDELT's terms before turning it on.

import { fetchJson, buildUrl, toolJson, toolError, clampLimit } from './util.js';

const ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';
const ATTRIBUTION = Object.freeze({
  name: 'GDELT Project',
  url: 'https://www.gdeltproject.org/',
});
const CITATION = `${ATTRIBUTION.name}: ${ATTRIBUTION.url}`;

export const key = 'gdelt-doc';
export const title = 'GDELT DOC 2.0 (news article search)';
export const docsUrl = 'https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/';
export const termsNote =
  'Open-data service; article rights remain with their publishers. Metadata and URLs only.';

export function tools(config) {
  return [
    {
      name: 'gdelt.search',
      description:
        'Search worldwide news article metadata via the GDELT DOC 2.0 API. Returns title, url, domain, seendate and language. Metadata and links only.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (GDELT query syntax).' },
          timespan: {
            type: 'string',
            description: "Look-back window, e.g. '24h', '7d', '30min'. Default '24h'.",
            default: '24h',
          },
          limit: { type: 'integer', description: 'Max articles (1-25, default 10).' },
        },
        required: ['query'],
      },
      handler: async (args) => {
        const query = args && args.query;
        if (!query || typeof query !== 'string') return toolError('query is required');
        const limit = clampLimit(args && args.limit);
        const timespan = (args && args.timespan) || '24h';
        const url = buildUrl(ENDPOINT, {
          query,
          mode: 'ArtList',
          format: 'json',
          maxrecords: limit,
          timespan,
        });
        const data = await fetchJson(url, { fetchImpl: config && config.fetch });
        const articles = Array.isArray(data && data.articles) ? data.articles : [];
        const items = articles.slice(0, limit).map((a) => ({
          title: a.title,
          url: a.url,
          domain: a.domain,
          seendate: a.seendate,
          language: a.language,
        }));
        return toolJson(
          {
            provider: key,
            query,
            timespan,
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
