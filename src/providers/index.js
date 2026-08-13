// src/providers/index.js — the provider registry.
//
// Each provider module describes one free, keyless source and its tools. This
// file gathers them into a single PROVIDERS array and exposes providerTools(),
// which returns the flat tool list for exactly the providers the deployer has
// explicitly enabled.
//
// Governance rule — reachability is not permission: EVERY provider is disabled
// by default. A provider contributes tools only when
// config.providers[<key>].enabled === true, which is the deployer's own,
// deliberate act after reviewing that source's terms of use.

import gdeltDoc from './gdelt-doc.js';
import gdeltContext from './gdelt-context.js';
import arxiv from './arxiv.js';
import openalex from './openalex.js';
import crossref from './crossref.js';
import semanticscholar from './semanticscholar.js';
import europepmc from './europepmc.js';
import dblp from './dblp.js';
import hackernews from './hackernews.js';
import devto from './devto.js';

const READ_ONLY_EXTERNAL = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
});

export const PROVIDERS = [
  gdeltDoc,
  gdeltContext,
  arxiv,
  openalex,
  crossref,
  semanticscholar,
  europepmc,
  dblp,
  hackernews,
  devto,
];

// Return the tools for every enabled provider. A provider is enabled only when
// config.providers[provider.key].enabled === true. Disabled (the default)
// contributes nothing.
export function providerTools(config) {
  const providersCfg = (config && config.providers) || {};
  const tools = [];
  for (const provider of PROVIDERS) {
    const entry = providersCfg[provider.key];
    if (!entry || entry.enabled !== true) continue;
    for (const tool of provider.tools(config)) {
      tools.push({
        ...tool,
        title: tool.title || `${provider.title}: ${tool.name.split('.').at(-1)}`,
        annotations: tool.annotations || READ_ONLY_EXTERNAL,
      });
    }
  }
  return tools;
}

export default { PROVIDERS, providerTools };
