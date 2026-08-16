# Providers

citewire can query ten free news and research APIs as pass-through tools. Each
tool returns metadata and links to the original source. Nothing is stored and
nothing is republished.

None of these providers requires an API key. Every one of them ships
**disabled**. Read [Terms responsibility](#terms-responsibility) before you
enable any of them.

The free-access basis and courtesy limits below are summarized from each
provider's own documentation. They change. Treat the linked documentation, not
this page, as the current source of truth.

---

## GDELT DOC 2.0

- **Tool:** `gdelt.search`
- **Endpoint:** `https://api.gdeltproject.org/api/v2/doc/doc`
- **Returns:** Worldwide news article metadata (title, url, domain, seen date,
  language). Metadata and links only, never full text. Each successful result
  also cites [GDELT Project](https://www.gdeltproject.org/).
- **Free-access basis:** GDELT is an open-data project. The DOC endpoint needs
  no key. GDELT asks callers to pace requests courteously rather than hammer the
  endpoint.
- **Docs:** https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

## GDELT Context 2.0

- **Tool:** `gdelt.context`
- **Endpoint:** `https://api.gdeltproject.org/api/v2/context/context`
- **Returns:** Snippet-level context matches around a search term, with source
  metadata and URLs. Metadata and links only. Each successful result also cites
  [GDELT Project](https://www.gdeltproject.org/).
- **Free-access basis:** Open-data GDELT endpoint, no key required. As with the
  DOC API, pace requests courteously.
- **Docs:** https://blog.gdeltproject.org/announcing-the-gdelt-context-2-0-api/

## arXiv

- **Tool:** `arxiv.search`
- **Endpoint:** `https://export.arxiv.org/api/query`
- **Returns:** Preprint metadata (title, authors, abstract, categories, links)
  across physics, mathematics, computer science, and more. The API responds in
  Atom XML.
- **Request control:** citewire enforces an operative, process-local single-
  concurrency queue and at least 3000ms between arXiv request start times. It
  is not merely courteous pacing. This applies across all arXiv tool instances
  in one Node process, including after a failed request. Horizontally scaled
  deployments must add a shared limiter; the process-local limiter cannot
  coordinate separate processes or hosts.
- **Free-access basis:** Free and open, no key. Each paper's license controls
  reuse.
- **Docs:** https://info.arxiv.org/help/api/index.html

## OpenAlex

- **Tool:** `openalex.search`
- **Endpoint:** `https://api.openalex.org/works`
- **Returns:** Scholarly works, authors, and venues. Metadata is CC0.
- **Free-access basis:** OpenAlex currently provides a metered daily allowance:
  keyless requests have **$0.10/day**, a free API key has **$1/day**, and usage
  beyond the applicable allowance is paid. The current citewire adapter is
  keyless, so it cannot incur charges but will stop at the keyless allowance.
  Any future API key must be supplied only through runtime or environment
  configuration and must never be committed.
- **Docs:** https://docs.openalex.org/

## Crossref

- **Tool:** `crossref.search`
- **Endpoint:** `https://api.crossref.org/works`
- **Returns:** DOI registration metadata for scholarly works (titles, authors,
  containers, DOIs, links).
- **Free-access basis:** Free, no key. Crossref offers a "polite pool" with more
  consistent performance to callers who identify themselves in the `User-Agent`
  and `mailto` query parameter. Set the deployer's own contact as
  `providers.crossref.mailto`; citewire refuses a Crossref call without it.
  Abstracts remain third-party content and are not returned by this adapter.
- **Docs:** https://api.crossref.org/

## Semantic Scholar

- **Tool:** `semanticscholar.search`
- **Endpoint:** `https://api.semanticscholar.org/graph/v1/paper/search`
- **Returns:** Papers and the author graph (titles, abstracts, authors,
  citations, links). Abstracts are limited to 400-character excerpts. Each
  successful result also cites
  [Semantic Scholar](https://www.semanticscholar.org/).
- **Free-access basis:** Most endpoints are available without a key.
  Unauthenticated traffic shares a 1000 requests/second pool across all users
  and may be further throttled. New API keys start at one request/second and
  must remain secret.
- **Docs:** https://api.semanticscholar.org/api-docs/

## Europe PMC

- **Tool:** `europepmc.search`
- **Endpoint:** `https://www.ebi.ac.uk/europepmc/webservices/rest/search`
- **Returns:** Life-sciences and biomedical literature metadata (titles,
  authors, identifiers, and DOIs). The adapter does not return article bodies
  or abstracts. Each successful result cites
  [Europe PMC](https://europepmc.org/).
- **Free-access basis:** Free, no key required. Use only the official REST API,
  never crawl the Europe PMC website, and do not overload the service.
- **Docs:** https://europepmc.org/RestfulWebService

## dblp

- **Tool:** `dblp.search`
- **Endpoint:** `https://dblp.org/search/publ/api`
- **Returns:** Computer-science bibliography records (titles, authors, venues,
  years, links).
- **Free-access basis:** Free. dblp throttles heavy and bulk access, so keep
  request volume modest. citewire serializes calls within one Node process and
  waits at least 1000ms between starts. Multiple processes or hosts require a
  shared limiter, and callers must honor `Retry-After` after a 429.
- **Docs:** https://dblp.org/faq/How+to+use+the+dblp+search+API.html

## Hacker News

- **Tools:** `hackernews.top`, `hackernews.item`
- **Endpoint:** `https://hacker-news.firebaseio.com/v0/`
- **Returns:** Hacker News stories and items (title, url, author, score,
  comments) from the official Firebase API. Every item includes its canonical
  `news.ycombinator.com/item?id=...` link.
- **Free-access basis:** Public, no key, no documented hard limit. Pace requests
  reasonably. citewire uses only the official Firebase API, caps each call at
  25 items, and fetches top-story records sequentially. Do not scrape the HN
  website or persist and republish HN content.
- **Docs:** https://github.com/HackerNews/API

## DEV

- **Tool:** `devto.search`
- **Endpoint:** `https://dev.to/api/articles`
- **Returns:** Published DEV articles (title, author, tags, url, published date).
- **Free-access basis:** The public read endpoints require no key. Writing to
  DEV needs an API key, but citewire only reads. The adapter sends the required
  descriptive `User-Agent`, preserves author and canonical URL attribution,
  and returns metadata only. Do not store, mirror, or republish DEV content.
- **Docs:** https://developers.forem.com/api

---

## Terms responsibility

citewire ships every provider disabled. Enabling one is your deliberate act, and
it is your responsibility to review that provider's current terms of use for
your use case before you turn it on. Reachability is not permission. An endpoint
answering a request does not mean your intended use is allowed.

Free-tier terms, rate limits, and access rules change, sometimes without notice.
The summaries on this page are a starting point, not legal advice and not a
substitute for reading the provider's own terms at the time you deploy.

## Enforcement boundary

citewire enforces conditions that one Node process can reliably control:

- GDELT and Semantic Scholar attribution in structured and text results.
- Europe PMC source acknowledgment and metadata-only output.
- arXiv single concurrency and at least 3000ms between request starts.
- dblp single concurrency and at least 1000ms between request starts.
- Crossref deployer identification through `mailto` and `User-Agent`.
- Hacker News item links, sequential fan-out, and the 25-item cap.
- DEV's required descriptive `User-Agent`, author, and canonical URL fields.
- Short Semantic Scholar abstract excerpts rather than full abstract reuse.

Some obligations exist above the process boundary and remain the deployer's
responsibility. A horizontally scaled arXiv or dblp deployment needs a shared
limiter across every process and host. Operators must honor upstream 429 and
rate-limit headers, avoid retries that defeat backoff, keep every provider
pass-through and transient, review third-party content licenses, and re-review
terms before enabling a provider. citewire reports `Retry-After` in upstream
error text but cannot coordinate independent deployments. NewsData.io is not
included because its commercial use requires a paid decision.
