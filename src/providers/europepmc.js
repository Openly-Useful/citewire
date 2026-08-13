// src/providers/europepmc.js
//
// Queries: the Europe PMC REST search endpoint — life-sciences and biomedical
// literature metadata.
// Free-access basis: Europe PMC's search API is free and keyless. Metadata is
// open; reuse of each article follows that record's own license.
// Enabling this provider is the deployer's own act. Reachability is not
// permission: the deployer must review Europe PMC's terms before turning it on.

import { fetchJson, buildUrl, toolJson, toolError, clampLimit } from './util.js';

const ENDPOINT = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
const ATTRIBUTION = Object.freeze({
  name: 'Europe PMC',
  url: 'https://europepmc.org/',
});
const CITATION = `${ATTRIBUTION.name}: ${ATTRIBUTION.url}`;

export const key = 'europepmc';
export const title = 'Europe PMC (biomedical literature search)';
export const docsUrl = 'https://europepmc.org/RestfulWebService';
export const termsNote =
  'Official REST API metadata only; article reuse follows each record license. Do not crawl the Europe PMC website.';

export function tools(config) {
  return [
    {
      name: 'europepmc.search',
      description:
        'Search Europe PMC biomedical literature. Returns id, title, author string, journal title, publication year and DOI.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-text literature query.' },
          limit: { type: 'integer', description: 'Max results (1-25, default 10).' },
        },
        required: ['query'],
      },
      handler: async (args) => {
        const query = args && args.query;
        if (!query || typeof query !== 'string') return toolError('query is required');
        const limit = clampLimit(args && args.limit);
        const url = buildUrl(ENDPOINT, { query, format: 'json', pageSize: limit });
        const data = await fetchJson(url, { fetchImpl: config && config.fetch });
        const results =
          data && data.resultList && Array.isArray(data.resultList.result)
            ? data.resultList.result
            : [];
        const items = results.slice(0, limit).map((r) => ({
          id: r.id,
          title: r.title,
          authorString: r.authorString,
          journalTitle: r.journalTitle,
          pubYear: r.pubYear,
          doi: r.doi,
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
