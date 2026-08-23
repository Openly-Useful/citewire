# CiteWire

[![npm](https://img.shields.io/npm/v/citewire)](https://www.npmjs.com/package/citewire)
[![CI](https://github.com/Openly-Useful/citewire/actions/workflows/ci.yml/badge.svg)](https://github.com/Openly-Useful/citewire/actions)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[citewire.org](https://citewire.org) · [Openly Useful](https://openlyuseful.org)

Attribution-first MCP infrastructure for news and research discovery.

CiteWire gives agents structured, read-only access to news and research
metadata while preserving credit and traffic for the original publisher. It
can expose a compatible news platform as typed MCP tools, query optional public
provider APIs, or do both in one server.

The Community edition is useful on its own. It includes the MCP core, stdio and
HTTP transports, the generic platform adapter, and every provider adapter in
this repository under the MIT license. Commercial product direction is
additive and focused on managed operations, personalization, workflows,
collaboration, retained history, and support. See
[Product tiers](docs/product-tiers.md).

## What CiteWire is for

- **News platform operators** can expose a compatible read API through
  `news.list`, `news.get`, `news.topics`, and `news.about`.
- **Researchers and agent builders** can enable only the public news and
  research providers they want to query.
- **Self-hosters** can run the same server over stdio, stateless HTTP, or inside
  a Node serverless function.
- **Provider contributors** can add a focused adapter without introducing a
  runtime dependency.

CiteWire is not a full-text ingestion service, crawler, publisher, editorial
system, or rights-clearance service. It does not store or republish article
bodies. Provider reachability does not replace review of the provider's current
terms for your use case.

## Quick start

Requirements: Node.js 18 or newer. Community is an ESM-only Node package; it
does not provide a CommonJS entry point.

Create `citewire.config.json` with one provider enabled:

```json
{
  "providers": {
    "openalex": { "enabled": true }
  }
}
```

Run the server over stdio:

```sh
npx -y citewire --config citewire.config.json
```

stdio is the default transport and is the usual choice when an MCP client
launches citewire as a local process.

### MCP client configuration

Use an absolute config path because clients do not always launch from the
project directory:

```json
{
  "mcpServers": {
    "citewire": {
      "command": "npx",
      "args": [
        "-y",
        "citewire",
        "--config",
        "/absolute/path/to/citewire.config.json"
      ]
    }
  }
}
```

### HTTP transport

Run the stateless HTTP transport on port 8722:

```sh
npx -y citewire --config citewire.config.json --http 8722
```

The local endpoint accepts JSON-RPC over `POST /`. It does not offer sessions
or an event stream.

## Two ways to use it

### 1. Wrap a compatible news platform

Declare a platform with a display name, site URL, and read API base:

```json
{
  "platform": {
    "name": "Example Industry News",
    "siteUrl": "https://news.example",
    "apiBase": "https://news.example/api/v1/news"
  }
}
```

That configuration exposes four tools:

| Tool | Purpose |
| --- | --- |
| `news.list` | List items newest first, with optional topic, industry, text, date-window, and pagination filters. |
| `news.get` | Get one item by slug, including attribution and related coverage returned by the platform. |
| `news.topics` | Read the platform's active topic taxonomy. |
| `news.about` | Read static platform facts and the attribution policy. |

The required HTTP surface is documented in the
[platform read-API contract](docs/platform-contract.md).

### 2. Enable public provider tools

Provider adapters are included in Community and are disabled by default. A
provider becomes active only when its config entry sets `enabled` to `true`.

```json
{
  "providers": {
    "gdelt-doc": { "enabled": true },
    "arxiv": { "enabled": true },
    "crossref": {
      "enabled": true,
      "mailto": "operator@example.com"
    }
  }
}
```

Crossref requires the deployer's own contact email so requests can identify the
operator to its polite pool. citewire sends that address only to Crossref in
the request `mailto` parameter and `User-Agent`. Do not copy the example
address.

The current adapters are:

| Provider | Tools | Focus |
| --- | --- | --- |
| GDELT DOC 2.0 | `gdelt.search` | Worldwide news article metadata |
| GDELT Context 2.0 | `gdelt.context` | Snippet-level context around a term |
| arXiv | `arxiv.search` | Preprint metadata |
| OpenAlex | `openalex.search` | Scholarly works, authors, and venues |
| Crossref | `crossref.search` | DOI registration metadata |
| Semantic Scholar | `semanticscholar.search` | Papers and author graph metadata |
| Europe PMC | `europepmc.search` | Life-sciences literature metadata |
| dblp | `dblp.search` | Computer-science bibliography records |
| Hacker News | `hackernews.top`, `hackernews.item` | Stories and items from the official API |
| DEV | `devto.search` | Published DEV article metadata |

Read [Providers](docs/providers.md) before enabling one. That document records
the endpoint, documentation, free-access basis, and known courtesy limits for
each adapter. The provider's own documentation remains the source of truth.

## Configuration behavior

- `platform` is optional.
- `providers` is optional.
- A provider omitted from the config remains disabled.
- An empty config is valid and exposes no tools.
- Invalid config fails at startup with the field named in the error.
- `tools/list` is the authoritative tool list for a running deployment because
  enabled tools depend on that deployment's config.

A deployment can combine a platform and provider tools:

```json
{
  "platform": {
    "name": "Example Industry News",
    "siteUrl": "https://news.example",
    "apiBase": "https://news.example/api/v1/news"
  },
  "providers": {
    "openalex": { "enabled": true }
  }
}
```

## Optional Community policy foundation

CiteWire can expose a local, read-only foundation for source policy, rights
evaluation, and shadow inclusion scoring:

```json
{
  "community": {
    "enabled": true,
    "classifierMode": "shadow",
    "thresholds": {
      "adjacent_min": 0.5,
      "standard_min": 0.6
    }
  }
}
```

Every bundled source remains disabled by default. This setting performs no
network calls, loads no credentials, and cannot publish. Credential-based
rights checks accept opaque secret-manager references in memory but never
return those references. The classifier is forced to shadow mode and always
reports `publishable: false` until a separately reviewed editorial system and
evaluation corpus exist.

Read [Source registry and rights](docs/source-registry-and-rights.md) for the
runtime validation, fail-closed policy, canonical MCP tools and resources, and
current limitations.

## Design boundaries

- **MIT and zero dependency.** The package uses Node built-ins and has no
  runtime or development dependencies.
- **Node ESM.** Community supports Node.js 18 or newer through ESM. It does not
  provide CommonJS compatibility or a CommonJS build.
- **Read only.** The included tools query platform and provider read surfaces.
- **Stateless.** The Community server has no accounts, sessions, saved searches,
  or retained history.
- **Attribution first.** Results preserve source metadata and links supplied by
  the upstream platform or provider.
- **Config driven.** A deployer decides which tools are present. Nothing turns
  itself on.
- **Storage free.** The core does not retain provider responses or source
  content.

These boundaries are maintained through the
[project governance policy](docs/governance.md).

## Ecosystem and product documentation

- [Product tiers](docs/product-tiers.md) defines the permanent Community value
  and the additive commercial boundary.
- [Distribution](docs/distribution.md) contains the exact registry and catalog
  checklist. Unperformed submissions are marked `PENDING`.
- [Governance](docs/governance.md) explains decisions, provider stewardship,
  compatibility, and licensing.
- [Providers](docs/providers.md) documents each upstream provider.
- [Platform contract](docs/platform-contract.md) defines the compatible news
  read API.
- [Contributing](CONTRIBUTING.md) covers setup, tests, provider additions, and
  pull request expectations.
- [Releasing](docs/releasing.md) defines package and registry release controls.
- [Support](SUPPORT.md), [Security](SECURITY.md), and the
  [Code of Conduct](CODE_OF_CONDUCT.md) define community operating channels.

## Project origin

citewire was shaped through its first deployment for
[Karaya Group Industry News](https://karaya.group/industry-news). The public
platform contract is generic and can wrap any compatible read API.

## Contributing

Run the test suite with `npm test`. No install step is required. See
[CONTRIBUTING.md](CONTRIBUTING.md) before proposing a provider or a change to a
public contract.

## License

Community is MIT licensed. See [LICENSE](LICENSE).
