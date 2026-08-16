// src/providers/arxiv.js
//
// Queries: the arXiv API query endpoint — search across arXiv preprint
// metadata (physics, CS, math, quantitative biology, etc.).
// Free-access basis: arXiv offers an open, keyless API. This adapter enforces
// an operative process-local one-request gate with at least 3000ms between
// request starts. Responses are Atom XML, parsed here with plain string/regex
// operations to keep the zero-dependency guarantee.
// Enabling this provider is the deployer's own act. Reachability is not
// permission: the deployer must review arXiv's API terms before turning it on.

import { fetchText, buildUrl, toolJson, toolError, clampLimit } from './util.js';
import { scheduleArxivRequest } from './arxiv-limiter.js';

const ENDPOINT = 'https://export.arxiv.org/api/query';

export const key = 'arxiv';
export const title = 'arXiv (preprint search)';
export const docsUrl = 'https://info.arxiv.org/help/api/index.html';
export const termsNote =
  'Metadata access is open; each paper license controls reuse. citewire enforces one in-process request at a time and at least 3000ms between arXiv request starts; horizontally scaled deployments require a shared limiter.';

// Minimal, dependency-free extraction of the fields we expose from one <entry>.
function decodeEntities(s) {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function tagText(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decodeEntities(m[1].replace(/\s+/g, ' ').trim()) : '';
}

function parseEntries(xml, limit) {
  const entries = [];
  const re = /<entry\b[\s\S]*?<\/entry>/gi;
  let match;
  while ((match = re.exec(xml)) !== null && entries.length < limit) {
    const block = match[0];
    const authors = [];
    const authorRe = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi;
    let am;
    while ((am = authorRe.exec(block)) !== null) {
      authors.push(decodeEntities(am[1].replace(/\s+/g, ' ').trim()));
    }
    const summary = tagText(block, 'summary');
    entries.push({
      id: tagText(block, 'id'),
      title: tagText(block, 'title'),
      summary: summary.length > 400 ? summary.slice(0, 400) : summary,
      published: tagText(block, 'published'),
      authors,
    });
  }
  return entries;
}

export function tools(config) {
  return [
    {
      name: 'arxiv.search',
      description:
        'Search arXiv preprints. Returns id, title, a trimmed summary, publication date and authors.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search terms (matched across all fields).' },
          limit: { type: 'integer', description: 'Max results (1-25, default 10).' },
        },
        required: ['query'],
      },
      handler: async (args) => {
        const query = args && args.query;
        if (!query || typeof query !== 'string') return toolError('query is required');
        const limit = clampLimit(args && args.limit);
        const url = buildUrl(ENDPOINT, {
          search_query: `all:${query}`,
          max_results: limit,
        });
        const xml = await scheduleArxivRequest(() =>
          fetchText(url, { fetchImpl: config && config.fetch }),
        );
        const items = parseEntries(xml, limit);
        return toolJson({ provider: key, query, count: items.length, items, termsNote });
      },
    },
  ];
}

export default { key, title, docsUrl, termsNote, tools };
