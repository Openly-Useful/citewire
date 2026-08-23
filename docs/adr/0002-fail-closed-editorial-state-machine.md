# ADR 0002: Fail-closed editorial shadow foundation

- Status: Proposed implementation for review
- Date: 2026-08-16
- Scope: Pure and reference components only

## Context

CiteWire needs a reviewable path from normalized source metadata to RSS and MCP
projections without treating successful access, an inclusion score, or a model
result as permission to publish. The Community core remains stateless and
dependency-free, and the public foundation remains shadow-only.

## Decision

Add a deterministic editorial state machine:

`fetched -> rights_checked -> classified -> summarized -> verified -> publishable -> published`

Every stage can instead transition to `held`. Rights, classification, summary,
verification, and publishability are independent decisions. Decision events are
append-only, hash chained, versioned, and committed with the item transition by
an injected compare-and-swap store contract.

The included memory store is a reference and test fixture. Global pause defaults
to true. The publishability gate always includes
`AUTOMATED_PUBLICATION_DISABLED`; calibration evidence cannot activate it.
Retry policies and schedules are inert descriptors. RSS and MCP modules create
local previews only and are not composed into the root server.

## Failure behavior

Unknown policy, missing evidence, stale versions, unavailable evaluators,
unresolved exceptions, global pause, and exhausted retries all fail closed.
Dead letters describe work failures; they do not become a permissive editorial
state. Idempotency fingerprints reject key reuse with a different payload.
Publication reservations are reference primitives for replay tests only.

## Consequences

The state and reliability contracts can be tested before selecting persistence,
authentication, queues, schedulers, providers, models, or output destinations.
No production capability is activated by this change.
