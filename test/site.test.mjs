import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const site = new URL('../site/', import.meta.url);
const read = (path) => readFile(new URL(path, site), 'utf8');

const packageJson = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const serverJson = JSON.parse(await readFile(new URL('server.json', root), 'utf8'));
const html = await read('index.html');
const css = await read('styles.css');
const tokens = await read('styles/tokens.css');
const vercel = JSON.parse(await read('vercel.json'));

test('landing page has canonical, social, and truthful product metadata', () => {
  assert.match(html, /<title>CiteWire - Attribution-first MCP infrastructure<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/citewire\.org">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/citewire\.org\/og\.png">/);
  assert.match(html, /Keep the source <em>attached\.<\/em>/);
  assert.match(html, /It does not store or republish article bodies\./);
  assert.match(html, /Reachability is not permission\./);
  assert.doesNotMatch(html, /Citewire Cloud|hosted service|uptime|customer count|pricing/i);
});

test('landing page connects the verified public surfaces', () => {
  for (const href of [
    'https://github.com/Openly-Useful/citewire',
    'https://www.npmjs.com/package/citewire',
    'https://openlyuseful.org',
    'https://karaya.group/industry-news',
  ]) {
    assert.match(html, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.equal(packageJson.homepage, 'https://citewire.org');
  assert.equal(serverJson.websiteUrl, 'https://citewire.org');
  assert.doesNotMatch(html, /github\.com\/MeekPhills\/citewire/);
  assert.match(html, /aria-label="CiteWire home"/);
  assert.match(html, /<span>CiteWire<\/span>/);
});

test('landing page is local, dependency-free, responsive, and accessible by default', async () => {
  for (const path of [
    'index.html',
    'styles.css',
    'styles/tokens.css',
    'favicon.svg',
    'og.png',
    'robots.txt',
    'sitemap.xml',
    'vercel.json',
    'fonts/AtkinsonHyperlegibleNext-variable.woff2',
    'fonts/AtkinsonHyperlegibleNext-OFL.txt',
    'fonts/IBMPlexMono-variable-latin1.woff2',
    'fonts/IBMPlexMono-OFL.txt',
  ]) {
    await access(new URL(path, site));
  }

  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(html, /https?:\/\/[^"']+\.(?:css|js|woff2?)/i);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /min-height: 44px/);
  assert.match(tokens, /Openly Useful design-system family tokens/);
});

test('static hosting policy is locked down without authorizing deployment', () => {
  assert.equal(vercel.cleanUrls, true);
  assert.equal(vercel.trailingSlash, false);
  const headers = vercel.headers[0].headers;
  const csp = headers.find(({ key }) => key === 'Content-Security-Policy')?.value;
  assert.match(csp, /script-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(vercel.redirects[0].destination, 'https://citewire.org/:path*');
});
