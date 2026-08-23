import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APPROVED_CREDENTIAL_REFERENCE_SCHEMES,
  assertNoCredentialMaterial,
  credentialReferenceSummary,
  redactCredentialRef,
  validateCredentialRef,
} from '../src/security/credential-references.js';
import { redactForOutput } from '../src/security/redaction.js';

test('credential references accept only bounded opaque reference schemes', () => {
  const references = [
    'env://CITEWIRE_OPENALEX_REFERENCE',
    'vault://citewire/openalex/account-a',
    'aws-sm://us-east-1/citewire/openalex',
    'gcp-sm://citewire/openalex',
    'azure-kv://citewire/openalex',
  ];
  for (const reference of references) assert.equal(validateCredentialRef(reference), reference);
  assert.deepEqual(APPROVED_CREDENTIAL_REFERENCE_SCHEMES, ['env', 'vault', 'aws-sm', 'gcp-sm', 'azure-kv']);
  for (const reference of ['sk-live-value', 'Bearer a-real-value', 'https://example.test/secret', 'vault://../secret', 'vault://secret?value=yes']) {
    assert.throws(() => validateCredentialRef(reference), /credential_ref/);
  }
  assert.throws(() => validateCredentialRef('env://lowercase'), /uppercase environment variable/);
});

test('credential material inspection is recursive and allows only credential_ref values', () => {
  assert.equal(assertNoCredentialMaterial({ nested: [{ credential_ref: 'vault://citewire/openalex/account-a' }] }), true);
  assert.throws(() => assertNoCredentialMaterial({ nested: [{ api_key: 'value' }] }), /secret-like/);
  assert.throws(() => assertNoCredentialMaterial({ headers: { authorization: 'anything' } }), /secret-like/);
  assert.throws(() => assertNoCredentialMaterial({ note: 'Bearer abcdefghijklmnop' }), /credential material/);
  assert.throws(() => assertNoCredentialMaterial(JSON.parse('{"__proto__":{"safe":true}}')), /not accepted/);
  const circular = {};
  circular.self = circular;
  assert.throws(() => assertNoCredentialMaterial(circular), /circular/);
});

test('credential reference output never returns the opaque location', () => {
  const reference = 'vault://citewire/openalex/account-a';
  assert.equal(redactCredentialRef(reference), 'vault://[redacted]');
  assert.deepEqual(credentialReferenceSummary(reference), {
    credential_configured: true,
    credential_scheme: 'vault',
    credential_ref: 'vault://[redacted]',
  });
  const output = redactForOutput({ connector: { credential_ref: reference }, authorization: 'not-returned' });
  assert.equal(output.connector.credential_ref, 'vault://[redacted]');
  assert.equal(output.authorization, '[redacted]');
  assert.doesNotMatch(JSON.stringify(output), /openalex|account-a|not-returned/);
});
