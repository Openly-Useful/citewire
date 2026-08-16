import { assertProjectionEligible } from '../editorial/projection.js';

function xml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function normalizeRssRecord(record) {
  const required = ['id', 'title', 'canonical_url', 'published_at', 'publisher'];
  const missing = required.filter((key) => typeof record?.[key] !== 'string' || !record[key].trim());
  if (missing.length) throw new TypeError(`Normalized RSS record missing: ${missing.join(', ')}`);
  const canonical = new URL(record.canonical_url);
  if (!['http:', 'https:'].includes(canonical.protocol) || canonical.username || canonical.password) {
    throw new TypeError('canonical_url must use credential-free HTTP or HTTPS.');
  }
  const published = new Date(record.published_at);
  if (Number.isNaN(published.valueOf())) throw new TypeError('published_at must be a valid date.');
  return Object.freeze({
    id: record.id,
    title: record.title.trim(),
    canonical_url: canonical.href,
    published_at: published.toISOString(),
    publisher: record.publisher.trim(),
    summary: typeof record.summary === 'string' ? record.summary.trim() : '',
  });
}

export function renderRss({ title, homeUrl, feedUrl, description, records }) {
  const items = records.map(normalizeRssRecord).map((record) => `    <item>\n      <guid isPermaLink="false">${xml(record.id)}</guid>\n      <title>${xml(record.title)}</title>\n      <link>${xml(record.canonical_url)}</link>\n      <pubDate>${new Date(record.published_at).toUTCString()}</pubDate>\n      <source url="${xml(homeUrl)}">${xml(record.publisher)}</source>\n      <description>${xml(record.summary)}</description>\n    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${xml(title)}</title>\n    <link>${xml(homeUrl)}</link>\n    <description>${xml(description)}</description>\n    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${xml(feedUrl)}" rel="self" type="application/rss+xml"/>${items ? `\n${items}` : ''}\n  </channel>\n</rss>\n`;
}

export function createRssProjection({ store, rightsEvaluator, pauseController }) {
  if (!store || typeof rightsEvaluator !== 'function' || !pauseController) {
    throw new TypeError('RSS projection requires an injected store, rights evaluator, and pause controller.');
  }
  return Object.freeze({
    async preview({ accountId, feed }) {
      const records = [];
      const held = [];
      for (const item of store.listItems(accountId)) {
        try {
          const metadataRights = await rightsEvaluator({ item, operation: 'metadata', use_case: 'public_brief' });
          assertProjectionEligible({
            item,
            trace: store.getTrace(accountId, item.id),
            pauseState: pauseController.get(),
            rightsDecision: metadataRights,
            unresolvedExceptions: store.listExceptions(accountId, item.id),
          });
          const summaryRights = await rightsEvaluator({ item, operation: 'summary', use_case: 'public_brief' });
          records.push(normalizeRssRecord({
            ...item,
            summary: summaryRights?.allowed === true && summaryRights?.decision === 'allow' ? item.summary ?? '' : '',
          }));
        } catch (error) {
          held.push({ item_id: item.id, reason_code: error.code ?? 'PROJECTION_HELD' });
        }
      }
      records.sort((left, right) => right.published_at.localeCompare(left.published_at) || left.id.localeCompare(right.id));
      return Object.freeze({
        xml: renderRss({ ...feed, records }),
        manifest: Object.freeze({ projected_count: records.length, held_count: held.length, held }),
      });
    },
  });
}
