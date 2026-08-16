// src/providers/dblp.js
//
// Queries: the DBLP publication search API — a bibliographic index of computer
// science publications.
// Free-access basis: DBLP offers a free, keyless search API. Its data terms
// apply and it asks callers to throttle bulk use. Article rights remain with
// the publishers.
// Enabling this provider is the deployer's own act. Reachability is not
// permission: the deployer must review DBLP's data terms before turning it on.

import { fetchJson, buildUrl, toolJson, toolError, clampLimit } from './util.js';
import { scheduleDblpRequest } from './dblp-limiter.js';

const ENDPOINT = 'https://dblp.org/search/publ/api';

export const key = 'dblp';
export const title = 'DBLP (computer science bibliography search)';
export const docsUrl = 'https://dblp.org/faq/How+to+use+the+dblp+search+API.html';
export const termsNote =
  'Metadata is CC0; article rights remain with publishers. citewire serializes dblp calls with at least 1000ms between starts; distributed deployments need a shared limiter.';

// DBLP nests authors as either a single object or an array under authors.author.
function extractAuthors(info) {
  const a = info && info.authors && info.authors.author;
  if (!a) return [];
  const list = Array.isArray(a) ? a : [a];
  return list.map((x) => (x && typeof x === 'object' ? x.text : x)).filter(Boolean);
}

export function tools(config) {
  return [
    {
      name: 'dblp.search',
      description:
        'Search the DBLP computer science bibliography. Returns title, authors, venue, year and url.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-text publication query.' },
          limit: { type: 'integer', description: 'Max results (1-25, default 10).' },
        },
        required: ['query'],
      },
      handler: async (args) => {
        const query = args && args.query;
        if (!query || typeof query !== 'string') return toolError('query is required');
        const limit = clampLimit(args && args.limit);
        const url = buildUrl(ENDPOINT, { q: query, format: 'json', h: limit });
        const data = await scheduleDblpRequest(() =>
          fetchJson(url, { fetchImpl: config && config.fetch }),
        );
        const hits =
          data && data.result && data.result.hits && Array.isArray(data.result.hits.hit)
            ? data.result.hits.hit
            : [];
        const items = hits.slice(0, limit).map((h) => {
          const info = h.info || {};
          return {
            title: info.title,
            authors: extractAuthors(info),
            venue: info.venue,
            year: info.year,
            url: info.url,
          };
        });
        return toolJson({ provider: key, query, count: items.length, items, termsNote });
      },
    },
  ];
}

export default { key, title, docsUrl, termsNote, tools };
