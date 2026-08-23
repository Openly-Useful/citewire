# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-23

### Added

- Official MCP Registry metadata for the npm package and stdio transport
- A manual, approval-ready release workflow for npm provenance and MCP Registry
  publication
- Public security, support, conduct, and release documentation
- Automated consistency checks for release metadata
- Human-readable tool titles and standard read-only tool annotations
- Product-tier and governance policies that preserve the complete MIT-licensed
  Community edition
- A dependency-free `citewire.org` landing site linking the canonical project,
  repository, npm package, Openly Useful, and Karaya Industry News
- A disabled-by-default Community source registry with explicit rights policy,
  review metadata, and account-isolated personal and organization scopes
- An explainable, observe-only classifier and calibration contract with
  configurable score bands that cannot activate sources or publication
- Rights-gated local RSS and MCP article projections that remain uncomposed and
  perform no publication
- A fail-closed editorial shadow engine with global pause, independent gates,
  deterministic retries, idempotency, account isolation, and immutable traces
- Redacted credential references and reviewed HTTPS endpoint validation for
  optional connector implementations

### Changed

- Streamable HTTP now validates Origin, binds the local listener to loopback,
  enforces required media headers and protocol versions, and returns HTTP 202
  with an empty body for accepted notifications

### Fixed

- Added stable GDELT Project and Semantic Scholar attribution to their provider
  result payloads and text content, plus Europe PMC source acknowledgment.
- Enforced process-local arXiv request serialization and a 3000ms minimum
  interval between request starts, and process-local dblp serialization with a
  1000ms minimum start interval.
- Required a deployer-owned Crossref `mailto` contact, added canonical Hacker
  News item links, and limited Semantic Scholar abstracts to short excerpts.
- Updated OpenAlex access guidance to its current metered allowance.
- Documented the Node 18+ ESM-only Community runtime and pinned release action
  revisions to reviewed commits.

## [0.1.0] - 2026-07-29

### Added

- Attribution-first MCP server for configurable news platforms
- Disabled-by-default tools for ten free news and research APIs
- Stdio and Streamable HTTP transports
- Zero-dependency Node.js package and command-line interface

[Unreleased]: https://github.com/Openly-Useful/citewire/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Openly-Useful/citewire/compare/d4d3b77992930486205cb6b8c43e0a771472f2be...v0.2.0
[0.1.0]: https://github.com/Openly-Useful/citewire/tree/d4d3b77992930486205cb6b8c43e0a771472f2be
