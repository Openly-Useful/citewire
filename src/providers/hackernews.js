// src/providers/hackernews.js
//
// Queries: the official Hacker News Firebase API — top-story ids and individual
// item records.
// Free-access basis: the HN API is public and keyless. Linked articles retain
// their original rights; this is a research tool, not a publication source.
// Enabling this provider is the deployer's own act. Reachability is not
// permission: the deployer must review HN's API terms before turning it on.

import { fetchJson, toolJson, toolError, clampLimit } from './util.js';

const BASE = 'https://hacker-news.firebaseio.com/v0/';

export const key = 'hackernews';
export const title = 'Hacker News (official public API)';
export const docsUrl = 'https://github.com/HackerNews/API';
export const termsNote =
  'Official public API; linked articles retain original rights. Research tool only — not a publication source.';

function mapItem(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    hn_url: item.id ? `https://news.ycombinator.com/item?id=${item.id}` : null,
    score: item.score,
    by: item.by,
    time: item.time,
    descendants: item.descendants,
  };
}

export function tools(config) {
  const fetchImpl = config && config.fetch;
  return [
    {
      name: 'hackernews.top',
      description:
        'Fetch the current Hacker News top stories. Returns id, title, url, score, author, time and comment count.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'integer', description: 'Max stories (1-25, default 10).' },
        },
      },
      handler: async (args) => {
        const limit = clampLimit(args && args.limit);
        const ids = await fetchJson(`${BASE}topstories.json`, { fetchImpl });
        const top = (Array.isArray(ids) ? ids : []).slice(0, limit);
        const items = [];
        // Fetched sequentially to stay courteous to the free public endpoint.
        for (const id of top) {
          const item = await fetchJson(`${BASE}item/${id}.json`, { fetchImpl });
          const mapped = mapItem(item);
          if (mapped) items.push(mapped);
        }
        return toolJson({ provider: key, count: items.length, items, termsNote });
      },
    },
    {
      name: 'hackernews.item',
      description: 'Fetch a single Hacker News item by id.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'The Hacker News item id.' },
        },
        required: ['id'],
      },
      handler: async (args) => {
        const id = args && args.id;
        if (id === undefined || id === null || id === '') return toolError('id is required');
        const item = await fetchJson(`${BASE}item/${id}.json`, { fetchImpl });
        if (!item) return toolError(`no item found for id ${id}`);
        return toolJson({ provider: key, item: mapItem(item), termsNote });
      },
    },
  ];
}

export default { key, title, docsUrl, termsNote, tools };
