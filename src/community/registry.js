import { readFileSync } from 'node:fs';

const REGISTRY_URL = new URL('./default-sources.json', import.meta.url);
const SCHEMA_URL = new URL('./source-registry.schema.json', import.meta.url);
const SOURCE_TYPES = new Set(['news', 'editorial', 'newsletter', 'repository', 'research']);
const ACCESS_MODES = new Set(['public', 'personal_credential', 'organization_credential']);
const USE_CASES = new Set(['personal_research', 'organization_internal', 'public_brief', 'republication']);
const OPERATIONS = new Set(['metadata', 'excerpt', 'summary', 'republication']);
const SECRET_LIKE_KEY = /password|passphrase|secret|token|api[_-]?key|authorization|cookie/i;
const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/;

function fail(path, message) {
  throw new TypeError(`Invalid CiteWire source registry at ${path}: ${message}`);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function expectObject(value, path) {
  if (!isPlainObject(value)) fail(path, 'must be an object.');
}

function expectExactKeys(value, path, allowed, required = []) {
  expectObject(value, path);
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${path}.${key}`, 'is not supported.');
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, 'is required.');
  }
}

function expectString(value, path) {
  if (typeof value !== 'string' || value.trim() === '') fail(path, 'must be a non-empty string.');
}

function expectHttpUrl(value, path) {
  expectString(value, path);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(path, 'must be an absolute URL.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    fail(path, 'must be an HTTP(S) URL without embedded credentials.');
  }
}

function expectDate(value, path) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(path, 'must be an ISO date.');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(path, 'must be a real calendar date.');
  }
}

function expectDateTime(value, path) {
  expectString(value, path);
  const match = ISO_DATE_TIME.exec(value);
  if (!match) fail(path, 'must be an ISO date-time.');
  const [, year, month, day, hour, minute, second, , offsetHour = '00', offsetMinute = '00'] = match;
  const calendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const realDate = (
    calendar.getUTCFullYear() === Number(year) &&
    calendar.getUTCMonth() === Number(month) - 1 &&
    calendar.getUTCDate() === Number(day)
  );
  if (
    !realDate ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59 ||
    Number(offsetHour) > 23 ||
    Number(offsetMinute) > 59 ||
    Number.isNaN(Date.parse(value))
  ) {
    fail(path, 'must be an ISO date-time.');
  }
}

function expectEnumArray(value, path, allowed, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0)) {
    fail(path, nonEmpty ? 'must be a non-empty array.' : 'must be an array.');
  }
  if (new Set(value).size !== value.length) fail(path, 'must not contain duplicates.');
  for (const [index, item] of value.entries()) {
    if (!allowed.has(item)) fail(`${path}[${index}]`, `contains unsupported value ${String(item)}.`);
  }
}

export function assertNoSecretLikeFields(value, path = 'value', seen = new Set()) {
  if (value === null || typeof value !== 'object') return;
  if (seen.has(value)) fail(path, 'must not contain circular references.');
  seen.add(value);
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  for (const [key, nested] of entries) {
    const childPath = Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`;
    if (!Array.isArray(value) && SECRET_LIKE_KEY.test(key)) {
      fail(childPath, 'secret-like fields are not accepted; use the rights evaluator with an opaque reference.');
    }
    assertNoSecretLikeFields(nested, childPath, seen);
  }
  seen.delete(value);
}

function validateSource(source, index) {
  const path = `sources[${index}]`;
  expectExactKeys(
    source,
    path,
    ['id', 'name', 'type', 'homepage', 'adapter', 'enabled_by_default', 'review', 'rights'],
    ['id', 'name', 'type', 'homepage', 'enabled_by_default', 'review', 'rights'],
  );
  if (typeof source.id !== 'string' || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(source.id)) {
    fail(`${path}.id`, 'must be a lowercase, hyphen-delimited identifier.');
  }
  expectString(source.name, `${path}.name`);
  if (!SOURCE_TYPES.has(source.type)) fail(`${path}.type`, 'is unsupported.');
  expectHttpUrl(source.homepage, `${path}.homepage`);
  if (source.adapter !== undefined) {
    if (typeof source.adapter !== 'string' || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(source.adapter)) {
      fail(`${path}.adapter`, 'must be a lowercase, hyphen-delimited identifier.');
    }
  }
  if (source.enabled_by_default !== false) fail(`${path}.enabled_by_default`, 'must remain false.');

  expectExactKeys(
    source.review,
    `${path}.review`,
    ['cadence_days', 'last_reviewed', 'review_basis'],
    ['cadence_days', 'last_reviewed', 'review_basis'],
  );
  if (!Number.isInteger(source.review.cadence_days) || source.review.cadence_days < 1) {
    fail(`${path}.review.cadence_days`, 'must be a positive integer.');
  }
  expectDate(source.review.last_reviewed, `${path}.review.last_reviewed`);
  expectHttpUrl(source.review.review_basis, `${path}.review.review_basis`);

  expectExactKeys(
    source.rights,
    `${path}.rights`,
    ['access_modes', 'allowed_operations', 'notice'],
    ['access_modes', 'allowed_operations', 'notice'],
  );
  expectEnumArray(source.rights.access_modes, `${path}.rights.access_modes`, ACCESS_MODES, { nonEmpty: true });
  expectExactKeys(source.rights.allowed_operations, `${path}.rights.allowed_operations`, [...USE_CASES]);
  for (const [useCase, operations] of Object.entries(source.rights.allowed_operations)) {
    expectEnumArray(operations, `${path}.rights.allowed_operations.${useCase}`, OPERATIONS);
  }
  expectString(source.rights.notice, `${path}.rights.notice`);
}

export function validateRegistry(registry) {
  assertNoSecretLikeFields(registry, 'registry');
  expectExactKeys(
    registry,
    'registry',
    ['schema_version', 'generated_at', 'sources'],
    ['schema_version', 'generated_at', 'sources'],
  );
  if (registry.schema_version !== '1.0.0') fail('registry.schema_version', 'must be 1.0.0.');
  expectDateTime(registry.generated_at, 'registry.generated_at');
  if (!Array.isArray(registry.sources)) fail('registry.sources', 'must be an array.');
  registry.sources.forEach(validateSource);
  const ids = registry.sources.map((source) => source.id);
  if (new Set(ids).size !== ids.length) fail('registry.sources', 'must have unique source ids.');
  return structuredClone(registry);
}

function readJson(url) {
  return JSON.parse(readFileSync(url, 'utf8'));
}

export function loadDefaultRegistry() {
  return validateRegistry(readJson(REGISTRY_URL));
}

export function loadRegistrySchema() {
  return structuredClone(readJson(SCHEMA_URL));
}

export function getSource(registry, id) {
  const validated = validateRegistry(registry);
  const source = validated.sources.find((entry) => entry.id === id);
  return source ? structuredClone(source) : null;
}

export function listSources(registry, { type, dueBefore } = {}) {
  const validated = validateRegistry(registry);
  if (type !== undefined && !SOURCE_TYPES.has(type)) {
    throw new TypeError(`Unsupported source type: ${String(type)}`);
  }
  let dueBeforeTime;
  if (dueBefore !== undefined) {
    dueBeforeTime = Date.parse(dueBefore);
    try {
      expectDateTime(dueBefore, 'dueBefore');
    } catch {
      throw new TypeError('dueBefore must be a valid ISO date-time.');
    }
  }
  return validated.sources.filter((source) => {
    if (type && source.type !== type) return false;
    if (dueBeforeTime !== undefined) {
      const reviewed = Date.parse(`${source.review.last_reviewed}T00:00:00.000Z`);
      const due = reviewed + source.review.cadence_days * 86400000;
      if (due > dueBeforeTime) return false;
    }
    return true;
  });
}
