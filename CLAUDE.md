# CLAUDE.md

Read `PROJECT_HANDOFF.md`, `CLAUDE_CODE_LAUNCH_PROMPT.md`, and every file in
`.claude/orchestration/` before acting.

CiteWire Community is MIT licensed, zero-dependency, Node 18+ ESM,
provider-neutral, attribution-first, and read-only at its public boundary.
Default sources and connectors are inert until an operator explicitly enables
them. The classifier and editorial engine are shadow-only and cannot publish.
Credential material is represented only by opaque references and must never be
stored in the public registry, logs, fixtures, or continuity artifacts.

Cloud and Karaya are separate consumers with separate account and policy
boundaries. Never copy their credentials, source configuration, editorial
policy, private state, or account data into Community.

## Current verified baseline

- Canonical repository: `Openly-Useful/citewire`.
- Canonical main: `e12d9b6e8efed725a085a32e935e63e35241859a`.
- Public PRs #2, #3, #4, #6, #7, and #8 are merged.
- `https://citewire.org/` returns HTTPS 200 with the verified landing page.
- Main passes 119 committed tests and five release-metadata checks.
- The public product foundations now include the source registry, rights
  policy, RSS and MCP projections, optional Studio, credential-reference and
  connector boundaries, calibrated classifier, and fail-closed editorial
  shadow engine.
- Nothing in this baseline proves a package, registry, provider, connector,
  production editorial rollout, or automatic publication is active.

## Active gates

- Draft orchestration PR #1 may be refreshed and validated, but not merged
  without separate approval.
- Openly Useful PR #8 and Karaya PR #17 are current, green, clean drafts. Keep
  both unmerged unless their owner gates are separately satisfied.
- Cloud PR #1 is a clean draft pinned to Community commit `10aee95`; it remains
  undeployed and account-isolated.
- npm still reports `citewire@0.1.0`; Community `0.2.0` is not published.
- Karaya automation remains a separate workstream. Public cron requests return
  HTTP 200 every 15 minutes, but source-level fetch health, queue age, held
  volume, and migration state remain unverified.
- Preserve the 41 untracked owner screenshots and every unrelated dirty
  worktree exactly as found.

## Hard stops

Stop for a failed check, unexpected diff, secret, owner overlap, protected
asset, paid-service decision, provider or connector activation, migration,
production data/configuration change, merge, tag, package or registry publish,
release, deployment, DNS change, or any irreversible action without explicit
owner approval. Visible Karaya copy remains gated on Luis's read-aloud
approval.
