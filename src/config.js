// src/config.js — load and validate citewire configuration.
//
// A citewire deployment is described entirely by a small JSON object: who the
// server says it is, an optional platform (a compatible news read API to wrap),
// and which providers are enabled. This module reads that JSON from disk and
// validates it with errors that name the offending field, so a bad config fails
// loudly at startup rather than as a mysterious runtime fault. Unknown provider
// keys are allowed here on purpose: the provider registry, not this file, is the
// authority on which providers exist.

import { readFileSync } from 'node:fs';
import { validateThresholds } from './community/classifier.js';
import { assertNoSecretLikeFields, validateRegistry } from './community/registry.js';

export const DEFAULT_CONFIG = {
  serverInfo: { name: 'citewire', version: '0.2.0' },
  instructions:
    'Read-only, attribution-first tools over free news sources and free article APIs. ' +
    'Every item credits its original publisher and links to the original article.',
  providers: {},
};

// Throw a TypeError naming the bad field. Kept tiny so validators read cleanly.
function fail(message) {
  throw new TypeError(`Invalid citewire config: ${message}`);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateConfig(config) {
  if (!isPlainObject(config)) fail('config must be an object.');

  if (config.serverInfo !== undefined) {
    const info = config.serverInfo;
    if (!isPlainObject(info)) fail('serverInfo must be an object.');
    if (typeof info.name !== 'string') fail('serverInfo.name must be a string.');
    if (typeof info.version !== 'string') fail('serverInfo.version must be a string.');
  }

  if (config.instructions !== undefined && typeof config.instructions !== 'string') {
    fail('instructions must be a string.');
  }

  if (config.platform !== undefined) {
    const p = config.platform;
    if (!isPlainObject(p)) fail('platform must be an object.');
    if (typeof p.name !== 'string') fail('platform.name must be a string.');
    if (typeof p.siteUrl !== 'string') fail('platform.siteUrl must be a string.');
    if (typeof p.apiBase !== 'string') fail('platform.apiBase must be a string.');
  }

  if (config.providers !== undefined) {
    const providers = config.providers;
    if (!isPlainObject(providers)) fail('providers must be an object.');
    for (const [key, entry] of Object.entries(providers)) {
      if (!isPlainObject(entry)) fail(`providers.${key} must be an object.`);
      if (typeof entry.enabled !== 'boolean') {
        fail(`providers.${key}.enabled must be a boolean.`);
      }
    }
  }

  if (config.community !== undefined) {
    const community = config.community;
    if (!isPlainObject(community)) fail('community must be an object.');
    assertNoSecretLikeFields(community, 'config.community');
    const supported = new Set(['enabled', 'classifierMode', 'thresholds', 'registry']);
    for (const key of Object.keys(community)) {
      if (!supported.has(key)) fail(`community.${key} is not supported.`);
    }
    if (typeof community.enabled !== 'boolean') fail('community.enabled must be a boolean.');
    if (community.classifierMode !== undefined && community.classifierMode !== 'shadow') {
      fail('community.classifierMode must remain shadow.');
    }
    if (community.thresholds !== undefined) {
      try {
        validateThresholds(community.thresholds);
      } catch (error) {
        fail(error.message);
      }
    }
    if (community.registry !== undefined) {
      try {
        validateRegistry(community.registry);
      } catch (error) {
        fail(error.message);
      }
    }
  }

  return config;
}

export function loadConfig(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    throw new Error(`Could not read citewire config at ${path}: ${err.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Config at ${path} is not valid JSON: ${err.message}`);
  }
  return validateConfig(parsed);
}
