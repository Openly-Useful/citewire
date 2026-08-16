import assert from 'node:assert/strict';
import test from 'node:test';
import { assertEndpointlessConnector, validateConnectorEndpoint } from '../src/security/endpoint-policy.js';

test('connector endpoints require an exact reviewed HTTPS origin', () => {
  const allowedOrigins = ['https://api.example.test'];
  assert.equal(
    validateConnectorEndpoint('https://api.example.test/v1/articles', { allowedOrigins }),
    'https://api.example.test/v1/articles',
  );
  assert.throws(() => validateConnectorEndpoint('https://api.example.test/v1'), /no reviewed allowed_origins/);
  assert.throws(() => validateConnectorEndpoint('https://evil-api.example.test/v1', { allowedOrigins }), /not present/);
  assert.throws(() => validateConnectorEndpoint('https://api.example.test.evil.test/v1', { allowedOrigins }), /not present/);
});

test('connector endpoint validation rejects common SSRF and URL confusion inputs', () => {
  const allowedOrigins = ['https://api.example.test'];
  const rejected = [
    'http://api.example.test/v1',
    'https://user:password@api.example.test/v1',
    'https://api.example.test:8443/v1',
    'https://api.example.test/v1?next=http://localhost',
    'https://api.example.test/v1#fragment',
    'https://localhost/v1',
    'https://127.0.0.1/v1',
    'https://[::1]/v1',
    'https://service.internal/v1',
    'https://xn--e1afmkfd.test/v1',
    'https://api.example.test/a/../v1',
  ];
  for (const endpoint of rejected) {
    assert.throws(() => validateConnectorEndpoint(endpoint, { allowedOrigins }));
  }
});

test('current registry shape forces endpointless connector definitions', () => {
  const source = { id: 'example', adapter: 'example' };
  assert.equal(assertEndpointlessConnector({ id: 'one', source_id: 'example' }, source), true);
  assert.throws(
    () => assertEndpointlessConnector({ id: 'one', source_id: 'example', endpoint: 'https://api.example.test/v1' }, source),
    /no reviewed allowed_origins/,
  );
});
