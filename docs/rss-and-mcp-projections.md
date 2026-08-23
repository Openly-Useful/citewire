# Rights-gated RSS and MCP projections

The RSS and MCP article modules are pure local projections over an injected,
account-scoped store. They do not discover feeds, crawl pages, make network
requests, expose routes, write destinations, or publish content.

Both projections require:

1. An item in `publishable` or `published` state.
2. A valid immutable decision trace.
3. Global pause explicitly disabled.
4. A current `allow` decision for target metadata use.
5. No unresolved exception.

Summary text is returned only after a separate summary-use decision. Otherwise
the projection retains attribution and canonical metadata and leaves the
summary empty. Source bodies, credential references, and private decision notes
are never projected.

`createEditorialArticleTools` is deliberately not added to the root tool list.
Its `search_articles` and `get_article` descriptors exist for contract and
account-isolation tests. Public composition, transport wiring, and visible copy
require separate governance and owner review.
