# Distribution

This document is the execution ledger for distributing citewire through package
registries, MCP registries, and ecosystem catalogs. It separates verified
artifacts from proposed or unperformed submissions.

Last reviewed: 2026-08-23.

## Status rules

- `VERIFIED` means the public artifact or record was checked at the URL shown.
- `PREPARED` means an artifact exists in the current working tree and passes its
  documented local checks, but has not been published or accepted by a catalog.
- `PENDING` means the submission, claim, curation request, or acceptance has not
  been performed and verified through this checklist.
- `BLOCKED` means a required artifact or owner decision is missing.
- `NOT APPLICABLE` means the channel does not fit the current package or
  transport.

`PENDING` does not prove that an automated catalog has never indexed the public
repository. It means citewire has no verified, owner-controlled record for that
channel in this ledger. Do not change a status to `VERIFIED` without adding the
public record and verification date.

## Verified public artifacts

| Surface | Identifier | Status | Evidence |
| --- | --- | --- | --- |
| Canonical source repository | `Openly-Useful/citewire` | `VERIFIED` | [GitHub repository](https://github.com/Openly-Useful/citewire), created and checked 2026-08-15 |
| Legacy source repository | `MeekPhills/citewire` | `VERIFIED` | [Historical GitHub repository](https://github.com/MeekPhills/citewire), retained as readable provenance and checked 2026-08-15 |
| npm package | `citewire@0.2.0` | `VERIFIED` | [npm package](https://www.npmjs.com/package/citewire/v/0.2.0), including GitHub Actions provenance, checked with `npm view` on 2026-08-23 |
| GitHub release | `v0.2.0` | `VERIFIED` | [CiteWire 0.2.0](https://github.com/Openly-Useful/citewire/releases/tag/v0.2.0), published and checked 2026-08-23 |
| Official MCP Registry | `io.github.Openly-Useful/citewire@0.2.0` | `VERIFIED` | [Registry API record](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.Openly-Useful%2Fcitewire&version=0.2.0), active and checked 2026-08-23 |
| Website | `citewire.org` | `VERIFIED` | [CiteWire](https://citewire.org), checked 2026-08-23 |
| License | MIT | `VERIFIED` | Repository [LICENSE](../LICENSE) and npm package metadata |
| First deployment context | Karaya Group Industry News | `VERIFIED` | [Industry News](https://karaya.group/industry-news), checked 2026-08-12. This is deployment context, not an MCP catalog listing. |

The table does not claim a hosted MCP endpoint, support availability, service
level, or acceptance by any MCP catalog.

## Distribution readiness checklist

Complete these items before broad catalog submission:

- [x] Public source repository exists.
- [x] MIT license is present in the repository and package metadata.
- [x] npm package `citewire@0.2.0` is published with provenance.
- [x] README includes an install command, required config, and client example.
- [x] Provider tools are documented and disabled by default.
- [x] Product tiers and governance protect Community provider parity.
- [x] The published `package.json` contains the canonical MCP identifier
  `io.github.Openly-Useful/citewire` as `mcpName`.
- [x] `server.json` exists for the npm stdio package and passes the repository's
  local release-metadata tests.
- [x] A manual release workflow and [release runbook](releasing.md) are prepared
  for npm and Official MCP Registry publication.
- [x] Validate `server.json` with the pinned official publisher during release
  preflight.
- [x] Publish a package version containing the matching `mcpName` metadata.
- [x] Create a matching Git tag and GitHub release.
- [x] The prepared npm manifest requires `--config` and explains the absolute
  config path. An empty citewire config intentionally advertises no tools.
- [x] Distribution metadata describes only the npm stdio package. `server.json`
  has no generic remote entry, and the Karaya reference deployment is not used
  as one.
- [x] Record a maintainer-approved support URL or support policy if a catalog
  requires one.

The coordinated `0.2.0` package, tag, GitHub release, and Official MCP Registry
record are public and verified. See the [release runbook](releasing.md) for the
guarded process used to publish them.

## Canonical listing metadata

Use this copy as the starting point for registry fields. Adapt field length only
when a channel requires it.

| Field | Value |
| --- | --- |
| Product name | CiteWire |
| Short description | Attribution-first MCP server for news and research metadata. |
| Website | `https://citewire.org` |
| Repository | `https://github.com/Openly-Useful/citewire` |
| Package | `https://www.npmjs.com/package/citewire` |
| License | MIT |
| Runtime | Node.js 18 or newer |
| Local transport | stdio |
| Network transport | Stateless HTTP POST when self-hosted |
| Authentication | citewire itself requires none. Upstream provider and platform requirements remain their own. |
| Default tool state | No provider is enabled by default. Platform tools require a platform config. |
| Data handling | Read-only and stateless. Community does not store or republish article bodies. |
| Suggested categories | News, Research, Search, Data |

Long description:

> citewire exposes compatible news platforms and optional public news and
> research APIs as typed, read-only MCP tools. It preserves source attribution
> and links, stores no article bodies, and includes every maintained provider
> adapter in the MIT-licensed Community edition.

Do not add usage counts, customer counts, uptime, response-time claims, pricing,
support commitments, remote endpoints, or catalog badges without current
evidence and approval.

## Registry and catalog checklist

### Summary

| Order | Registry or catalog | Target record | Status | Next gate |
| --- | --- | --- | --- | --- |
| 1 | Official MCP Registry | `io.github.Openly-Useful/citewire@0.2.0` | `VERIFIED` | Monitor the active public record |
| 2 | GitHub MCP Registry | Curated CiteWire entry | `PENDING` | Curation request sent; await public visibility |
| 3 | Smithery | Proposed `<namespace>/citewire` | `BLOCKED` | Requires an approved MCPB or verified public HTTP endpoint; neither is part of this release |
| 4 | Glama | Repository-backed CiteWire record | `PENDING` | No duplicate found; await official-registry ingestion before manual submission |
| 5 | PulseMCP | Downstream CiteWire record | `PENDING` | No duplicate found; await official-registry ingestion |
| 6 | MCP.so | CiteWire server project | `PENDING` | Owner approval recorded; manual submission and public verification remain |
| 7 | Awesome MCP Servers | Search & Data Extraction entry | `PENDING` | [PR #12726](https://github.com/punkpeye/awesome-mcp-servers/pull/12726) opened; await merge and public visibility |

Submission does not equal acceptance. Only the Official MCP Registry record is
currently `VERIFIED`; curation requests and open pull requests remain `PENDING`
until their public entries are visible and correct.

### 1. Official MCP Registry

Submission guide:
[MCP Registry quickstart](https://modelcontextprotocol.io/registry/quickstart).

Target identifier: `io.github.Openly-Useful/citewire`. Version `0.2.0` is aligned
in the published npm package and `server.json` and is active in the Official MCP
Registry.

- [x] Align `package.json` `mcpName` and `server.json` `name` as
  `io.github.Openly-Useful/citewire` in the current working tree.
- [x] Declare npm package `citewire` with stdio transport in `server.json`.
- [x] Add local consistency tests for package name, version, transport,
  dependency policy, and release workflow safeguards.
- [x] Confirm that the canonical identifier and capitalization pass official
  GitHub namespace authentication.
- [x] Require `--config` in `server.json` so the package-only listing does not
  present a zero-tool default as if it were a configured server.
- [x] Keep `remotes` absent. This release describes the npm stdio package only.
- [x] Run the documented release preflight and validate the manifest with the
  pinned official publisher.
- [x] Publish a new npm version containing the matching `mcpName` metadata.
- [x] Create and push the matching release tag.
- [x] Run the manual, approval-gated release workflow for npm first and the
  Official MCP Registry second.
- [x] Verify the result through the registry API search for the exact canonical
  identifier.
- [x] Record the registry record URL, package version, submission date, and
  verification date below.

Record:

- Status: `VERIFIED`
- Package version: `0.2.0`
- Submitted by: the approval-gated `release.yml` workflow using GitHub OIDC
- Submitted on: 2026-08-23
- Public record: [Official MCP Registry API](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.Openly-Useful%2Fcitewire&version=0.2.0), active and verified 2026-08-23

### 2. GitHub MCP Registry

GitHub's publishing guidance uses the official MCP Registry manifest and then a
separate curation request for inclusion in GitHub's catalog. Reference:
[GitHub MCP Registry publishing guide](https://github.blog/ai-and-ml/generative-ai/how-to-find-install-and-manage-mcp-servers-with-the-github-mcp-registry/).

- [x] Complete and verify the Official MCP Registry entry first.
- [x] Confirm citewire is discoverable by its canonical identifier.
- [x] Send the documented curation request to `partnerships@github.com` from an
  authorized project account.
- [x] Include the canonical registry identifier, repository URL, npm URL, MIT
  license, and concise description.
- [x] Do not include a remote endpoint unless it has been verified.
- [ ] Record GitHub's public catalog URL only after the entry is visible.

Record:

- Status: `PENDING`
- Curation request: sent to `partnerships@github.com` on 2026-08-23
- Public record: not verified

### 3. Smithery

Publication guide: [Smithery publish documentation](https://smithery.ai/docs/build/publish).

Smithery currently documents two relevant paths. A URL publication requires a
public Streamable HTTP endpoint. A local stdio publication requires an MCPB
bundle. citewire has an npm stdio package and a self-hostable HTTP transport,
but this repository does not currently contain an MCPB bundle or a verified
catalog endpoint.

- [ ] Reserve or confirm an authorized Smithery namespace.
- [ ] Choose one publication path: verified HTTPS URL or MCPB bundle.
- [ ] For URL publication, deploy a configured server and verify
  `initialize`, `tools/list`, and a representative tool call.
- [ ] For local publication, create and test an MCPB bundle that collects the
  required citewire configuration.
- [ ] Ensure the scanner sees a useful tool list. Empty config exposes no tools.
- [ ] Publish with the Smithery UI or the documented CLI, using a qualified name
  ending in `/citewire`.
- [ ] Verify install instructions, tool schemas, source link, license, and
  configuration fields on the public page.
- [ ] Record the qualified name and public page URL.

Record:

- Status: `BLOCKED`
- Qualified name: not reserved or verified
- Publication path: not selected
- Public record: not verified
- Blocker: publishing requires an MCPB bundle or a verified public HTTP endpoint;
  neither artifact is authorized or present for the `0.2.0` stdio release.

### 4. Glama

Catalog: [Glama MCP Servers](https://glama.ai/mcp/servers).

- [x] Search Glama for the exact repository URL and package name.
- [ ] If no record exists, use **Add Server** with
  `https://github.com/Openly-Useful/citewire`.
- [ ] If an automated record exists, claim it through an authorized account
  instead of creating a duplicate.
- [ ] Verify that the generated install command includes a usable config path.
- [ ] Verify license, runtime, transports, source URL, and tool schemas.
- [ ] Remove or correct any inferred remote endpoint that has not been verified.
- [ ] Record the claimed public page URL and verification date.

Record:

- Status: `PENDING`
- Submission or claim: no duplicate found on 2026-08-23; awaiting official-registry ingestion before a manual submission
- Public record: not verified

### 5. PulseMCP

Catalog: [PulseMCP server directory](https://www.pulsemcp.com/servers).

PulseMCP is treated here as a downstream verification step after official MCP
Registry publication. No separate owner submission is recorded in this ledger.

- [x] Publish and verify the Official MCP Registry record.
- [x] Search PulseMCP for `io.github.Openly-Useful/citewire`, `citewire`, and the
  exact GitHub repository URL.
- [ ] If a record appears, verify package, source, license, and install details.
- [ ] If no record appears, use PulseMCP's then-current contact or feedback path
  and record the exact request channel.
- [ ] Record the public page URL only after it is visible and correct.

Record:

- Status: `PENDING`
- Downstream check: performed 2026-08-23; no public record visible yet
- Public record: not verified

### 6. MCP.so

Submission form: [MCP.so server submission](https://mcp.so/submit?type=server).

- [x] Review the current submission terms and obtain owner approval before
  proceeding.
- [ ] Submit `https://github.com/Openly-Useful/citewire` as an MCP Server project.
- [ ] Use the canonical listing metadata in this document.
- [ ] Do not classify citewire as a Remote Server without a verified public
  endpoint.
- [ ] Verify the resulting page, install instructions, source link, and license.
- [ ] Record the public page URL and submission date.

Record:

- Status: `PENDING`
- Owner approval: recorded in OU-149 release authorization
- Submission: not performed
- Public record: not verified

### 7. Awesome MCP Servers

Repository:
[punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers).
Contribution rules:
[CONTRIBUTING.md](https://github.com/punkpeye/awesome-mcp-servers/blob/main/CONTRIBUTING.md).

- [x] Re-read the current category list and entry format immediately before the
  pull request.
- [x] Choose one category. `Research` or `Search & Data Extraction` is the
  current fit. Do not add duplicate entries.
- [x] Add the entry in the category's required order and format.
- [x] Use the repository URL, MIT license, Node runtime, and npm install path.
- [x] State that configuration is required and providers are disabled by
  default.
- [x] Avoid metrics, availability, support, pricing, and remote endpoint claims.
- [x] Open a focused pull request and record its URL.
- [ ] Mark this channel `VERIFIED` only after merge and public visibility.

Proposed description:

> citewire is an attribution-first, read-only MCP server for compatible news
> platforms and optional public news and research APIs. It returns metadata and
> source links, stores no article bodies, and runs from the MIT-licensed npm
> package with an explicit config.

Record:

- Status: `PENDING`
- Pull request: [punkpeye/awesome-mcp-servers#12726](https://github.com/punkpeye/awesome-mcp-servers/pull/12726), opened 2026-08-23
- Public record: not verified

## Submission record template

Copy this block into the relevant channel after an action is performed:

```text
Status: PENDING | VERIFIED | BLOCKED
Channel:
Canonical identifier:
Artifact version:
Submitted or claimed by:
Submitted or claimed on:
Request or pull request URL:
Public record URL:
Verified by:
Verified on:
Corrections still needed:
```

## Release sequence

1. Merge and test the release content.
2. Align package version, `mcpName`, `server.json`, README, and release notes.
3. Publish the npm package.
4. Create the matching Git tag and GitHub release.
5. Publish and verify the Official MCP Registry record.
6. Request GitHub MCP Registry curation.
7. Submit, claim, or verify downstream catalogs one at a time.
8. Update this ledger with public evidence after each accepted record.

Never pre-mark a listing complete. A submitted form, sent email, or opened pull
request remains `PENDING` until the public entry is visible and correct.
