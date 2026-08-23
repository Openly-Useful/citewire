import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const HTML = new URL('../apps/studio/public/index.html', import.meta.url);
const SCRIPT = new URL('../apps/studio/public/app.js', import.meta.url);

test('Studio UI has accessible structure and capability-gated pause control', async () => {
  const html = await readFile(HTML, 'utf8');
  assert.match(html, /<html lang="en">/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /id="workspace"/);
  assert.match(html, /id="pause-control"[^>]*hidden/);
  assert.match(html, /aria-live="polite"/);
});

test('Studio UI does not expose threshold copy, secret inputs, or browser token storage', async () => {
  const [html, script] = await Promise.all([readFile(HTML, 'utf8'), readFile(SCRIPT, 'utf8')]);
  const combined = `${html}\n${script}`;
  assert.doesNotMatch(combined, /(?:threshold|\.50|\.60|0\.5|0\.6)/i);
  assert.doesNotMatch(html, /type="password"/i);
  assert.doesNotMatch(combined, /localStorage|sessionStorage|access[_-]?token|refresh[_-]?token/i);
  assert.doesNotMatch(script, /innerHTML/);
  assert.match(script, /textContent/);
  assert.match(html, /Values are never accepted/);
  assert.match(html, /Save disabled connector/);
});

test('Studio UI uses same-origin requests and never embeds a provider endpoint', async () => {
  const script = await readFile(SCRIPT, 'utf8');
  assert.match(script, /credentials: 'same-origin'/);
  assert.doesNotMatch(script, /https?:\/\//);
  assert.doesNotMatch(script, /endpoint/);
});
