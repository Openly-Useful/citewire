# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-13

### Added

- Official MCP Registry metadata for the npm package and stdio transport
- A manual, approval-ready release workflow for npm provenance and MCP Registry
  publication
- Public security, support, conduct, and release documentation
- Automated consistency checks for release metadata
- Human-readable tool titles and standard read-only tool annotations
- Product-tier and governance policies that preserve the complete MIT-licensed
  Community edition

### Changed

- Streamable HTTP now validates Origin, binds the local listener to loopback,
  enforces required media headers and protocol versions, and returns HTTP 202
  with an empty body for accepted notifications

## [0.1.0] - 2026-07-29

### Added

- Attribution-first MCP server for configurable news platforms
- Disabled-by-default tools for ten free news and research APIs
- Stdio and Streamable HTTP transports
- Zero-dependency Node.js package and command-line interface

[Unreleased]: https://github.com/MeekPhills/citewire/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/MeekPhills/citewire/compare/d4d3b77992930486205cb6b8c43e0a771472f2be...v0.2.0
[0.1.0]: https://github.com/MeekPhills/citewire/tree/d4d3b77992930486205cb6b8c43e0a771472f2be
