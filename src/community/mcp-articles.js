import { toolError, toolJson } from '../core/rpc.js';
import { assertProjectionEligible } from '../editorial/projection.js';

const READ_ONLY_LOCAL = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

export function createEditorialArticleTools({ accountId, store, rightsEvaluator, pauseController }) {
  if (!accountId || !store || typeof rightsEvaluator !== 'function' || !pauseController) {
    throw new TypeError('Editorial MCP projection requires an account scope and injected policy dependencies.');
  }

  async function project(item) {
    const metadataRights = await rightsEvaluator({ item, operation: 'metadata', use_case: 'public_brief' });
    assertProjectionEligible({
      item,
      trace: store.getTrace(accountId, item.id),
      pauseState: pauseController.get(),
      rightsDecision: metadataRights,
      unresolvedExceptions: store.listExceptions(accountId, item.id),
    });
    const summaryRights = await rightsEvaluator({ item, operation: 'summary', use_case: 'public_brief' });
    return {
      id: item.id,
      title: item.title,
      publisher: item.publisher,
      published_at: item.published_at,
      canonical_url: item.canonical_url,
      source_id: item.source_id,
      inclusion_tier: item.inclusion_tier ?? null,
      inclusion_reasons: Array.isArray(item.inclusion_reasons) ? [...item.inclusion_reasons] : [],
      summary: summaryRights?.allowed === true && summaryRights?.decision === 'allow' ? item.summary ?? '' : '',
    };
  }

  return [
    {
      name: 'search_articles',
      title: 'Search rights-gated article metadata',
      description: 'Search an injected local article store. This reference projection performs no fetches or writes.',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } }, additionalProperties: false },
      annotations: READ_ONLY_LOCAL,
      handler: async ({ query = '' }) => {
        const needle = query.toLowerCase();
        const articles = [];
        for (const item of store.listItems(accountId)) {
          if (needle && !`${item.title ?? ''} ${item.publisher ?? ''}`.toLowerCase().includes(needle)) continue;
          try { articles.push(await project(item)); } catch { /* fail closed per item */ }
        }
        return toolJson({ articles, count: articles.length, external_calls: false });
      },
    },
    {
      name: 'get_article',
      title: 'Get rights-gated article metadata',
      description: 'Get one injected local record only when every projection gate passes.',
      inputSchema: { type: 'object', properties: { id: { type: 'string', minLength: 1 } }, required: ['id'], additionalProperties: false },
      annotations: READ_ONLY_LOCAL,
      handler: async ({ id }) => {
        const item = store.getItem(accountId, id);
        if (!item) return toolError(`not_found: article ${String(id)}`);
        try { return toolJson(await project(item)); } catch (error) { return toolError(`held: ${error.code ?? 'PROJECTION_HELD'}`); }
      },
    },
  ];
}
