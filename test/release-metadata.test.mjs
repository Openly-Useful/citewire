import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { DEFAULT_CONFIG } from '../src/config.js';
import { createCitewire } from '../src/index.js';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const packageLock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
const serverJson = JSON.parse(await readFile(new URL('../server.json', import.meta.url), 'utf8'));
const releaseWorkflow = await readFile(
  new URL('../.github/workflows/release.yml', import.meta.url),
  'utf8',
);
const ciWorkflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

test('release versions and MCP ownership metadata stay aligned', async () => {
  assert.equal(packageJson.version, '0.2.0');
  assert.match(packageJson.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/);
  assert.equal(serverJson.version, packageJson.version);
  assert.equal(serverJson.packages[0].version, packageJson.version);
  assert.equal(serverJson.name, packageJson.mcpName);
  assert.equal(serverJson.packages[0].identifier, packageJson.name);
  assert.equal(DEFAULT_CONFIG.serverInfo.version, packageJson.version);

  const initialized = await createCitewire().handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {},
  });
  assert.equal(initialized.result.serverInfo.version, packageJson.version);
});

test('official registry metadata describes the npm stdio package', () => {
  assert.equal(
    serverJson.$schema,
    'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
  );
  assert.equal(serverJson.packages.length, 1);
  assert.equal(serverJson.packages[0].registryType, 'npm');
  assert.deepEqual(serverJson.packages[0].transport, { type: 'stdio' });
  assert.equal(serverJson.packages[0].packageArguments[0].name, '--config');
  assert.equal(serverJson.packages[0].packageArguments[0].isRequired, true);
  assert.ok(serverJson.description.length <= 100);
});

test('package remains public, provenance-enabled, MIT, and dependency-free', () => {
  assert.equal(packageJson.license, 'MIT');
  assert.deepEqual(packageJson.publishConfig, { access: 'public', provenance: true });
  assert.ok(packageJson.files.includes('server.json'));

  for (const field of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
    'bundleDependencies',
    'bundledDependencies',
  ]) {
    assert.equal(packageJson[field], undefined, `${field} must remain absent`);
  }

  assert.equal(packageLock.lockfileVersion, 3);
  assert.deepEqual(Object.keys(packageLock.packages), ['']);
});

test('release workflow is manual and defaults to a non-publishing preflight', () => {
  assert.match(releaseWorkflow, /^\s{2}workflow_dispatch:/m);
  assert.doesNotMatch(releaseWorkflow, /^\s{2}(push|pull_request|schedule):/m);
  assert.match(releaseWorkflow, /publish_npm:[\s\S]*?default: false/);
  assert.match(releaseWorkflow, /publish_mcp_registry:[\s\S]*?default: false/);
  assert.match(releaseWorkflow, /environment: release/);
  assert.match(releaseWorkflow, /id-token: write/);
  assert.match(releaseWorkflow, /Refuse an existing npm version/);
  assert.doesNotMatch(releaseWorkflow, /NPM_TOKEN|secrets\./);
});

test('release workflow pins reviewed v6 action commits', () => {
  for (const workflow of [ciWorkflow, releaseWorkflow]) {
    assert.match(
      workflow,
      /# actions\/checkout v6\.1\.0\s+uses: actions\/checkout@d23441a48e516b6c34aea4fa41551a30e30af803/,
    );
    assert.match(
      workflow,
      /# actions\/setup-node v6\.5\.0\s+uses: actions\/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38/,
    );
    assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v\d/);
  }
});
