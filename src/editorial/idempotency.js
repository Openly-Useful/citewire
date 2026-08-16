import { createHash } from 'node:crypto';

function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (plain(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : stableJson(value)).digest('hex');
}

function required(value, name) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${name} is required.`);
  return value;
}

export function requestFingerprint(body) {
  return sha256(body ?? null);
}

export function workKey({ accountId, itemId, revision, stage, policyBundleVersion }) {
  return `work:${sha256({
    account_id: required(accountId, 'accountId'),
    item_id: required(itemId, 'itemId'),
    revision: required(revision, 'revision'),
    stage: required(stage, 'stage'),
    policy_bundle_version: required(policyBundleVersion, 'policyBundleVersion'),
  })}`;
}

export function publicationKey({ accountId, targetId, itemId, revision }) {
  return `publication:${sha256({
    account_id: required(accountId, 'accountId'),
    target_id: required(targetId, 'targetId'),
    item_id: required(itemId, 'itemId'),
    revision: required(revision, 'revision'),
  })}`;
}
