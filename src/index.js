// src/index.js — the composition root.
//
// Wires the pieces into one MCP server: platform tools (a wrapped news read
// API) plus provider tools (free news sources and article APIs from the
// provider registry), handed to the transport-agnostic core. Transports import
// createCitewire, build a server, and pump messages through server.handle.
// Everything downstream is config-driven, so what a deployment exposes is a
// property of its config, not of this file.

import { createServer, toolJson, toolError } from './core/rpc.js';
import { loadConfig, validateConfig } from './config.js';
import { platformTools } from './platform/tools.js';
import { providerTools } from './providers/index.js';
import { communityResources, communityResourceTemplates, communityTools } from './community/mcp.js';

const DEFAULT_INSTRUCTIONS =
  'Read-only, attribution-first tools over free news sources and free article APIs. ' +
  'Every item credits its original publisher and links to the original article, and ' +
  'source rights remain with their publishers.';

export function createCitewire(config = {}) {
  const validated = validateConfig(config);
  const tools = [
    ...platformTools(validated),
    ...providerTools(validated),
    ...communityTools(validated),
  ];
  return createServer({
    serverInfo: validated.serverInfo ?? { name: 'citewire', version: '0.2.0' },
    instructions: validated.instructions ?? DEFAULT_INSTRUCTIONS,
    tools,
    resources: communityResources(validated),
    resourceTemplates: communityResourceTemplates(validated),
  });
}

export { createServer, toolJson, toolError, loadConfig };
export { classifyInclusion, CLASSIFIER_MODEL_CARD, DEFAULT_THRESHOLDS } from './community/classifier.js';
export { evaluateRights } from './community/rights.js';
export { loadDefaultRegistry, loadRegistrySchema, validateRegistry } from './community/registry.js';
