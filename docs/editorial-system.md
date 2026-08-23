# Editorial shadow system

This directory documents the optional pure/reference components in
`src/editorial`. They do not run when CiteWire starts and are not exported from
the package root.

## Invariants

- New items begin at `fetched`; no state may be skipped.
- Any denied, unknown, stale, or unavailable decision transitions to `held`.
- A successful fetch never implies reuse rights.
- Classification remains shadow-only and cannot mark an item publishable.
- Summary rights and metadata rights are evaluated separately.
- Verification is independent from both rights and classification.
- Global pause starts enabled and blocks work and projections.
- The current publishability gate always holds because automated publication is
  disabled.
- Decision events are immutable and hash chained.
- Store transitions use an expected version; racing workers cannot both win.

## Reliability contracts

Work and publication identifiers are deterministic hashes of account, item,
revision, stage or target, and policy version. Reusing an idempotency key with a
different request fingerprint is a conflict. Retry calculations are bounded
descriptors; no timer or queue is included. Exhausted work is described as a
dead letter and its item remains held.

The five assessment descriptors cover 15-minute, hourly, daily, weekly, and
monthly review cadences. They perform no scheduling themselves.

## Integration boundary

A future deployment must provide authenticated account scope, persistence,
transactional compare-and-swap behavior, secret-manager resolution, and any
worker infrastructure. Those choices require separate review. The reference
memory store must not be presented as durable production storage.
