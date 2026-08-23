# Verification evidence

Evidence date: 2026-08-23, America/New_York.

## Public CiteWire

- Canonical main resolved to `e12d9b6e8efed725a085a32e935e63e35241859a`.
- PRs #2, #3, #4, #6, #7, and #8 are merged.
- The committed suite passed 119 tests.
- Release metadata passed five checks.
- Package metadata requires Node 18 or newer and has no dependencies.
- `https://citewire.org/` returned HTTPS 200 with strict response headers.
- npm reported `citewire@0.1.0` as latest.
- GitHub reported no tags or releases.
- GitHub vulnerability reporting returned 204, confirming it is enabled.

## Draft integrations

| Repository | PR | Head | Verified state |
| --- | ---: | --- | --- |
| Openly-Useful/citewire | #1 | refreshed by this branch | Draft; must pass Node 18/22 after push |
| Openly-Useful/openlyuseful.org | #8 | `e48d606` | Draft, mergeable, clean, validator and preview green |
| MeekPhills/karayagroup | #17 | `004a8e0` | Draft, mergeable, clean, 432 tests and CI green |
| MeekPhills/citewire-cloud | #1 | `6906827` | Draft, mergeable, clean, 15 tests and Node 18/22 green |

## Karaya read-only observation

- Registry API: 49 sources total, 27 monitored, 22 directory-only.
- Seven-day feed: six items.
- Newest visible publication: approximately 60.6 hours old.
- Production logs: `POST /api/cron/ingest` returned 200 at 15-minute cadence.
- Interpretation: the observed freshness gap is not evidence of a missing cron.
  Source-level fetch results, queue age, held volume, and migration state remain
  unknown.

## Tracker reconciliation

- OU-145 and OU-180 through OU-183 were read against their defined scopes,
  commented with merged-commit and test evidence, and marked Done.
- OU-143 remains In Progress.
- OU-149 remains Todo.
- KAR-69 remains In Progress and received the read-only freshness observation.

## Protected state

- Forty-one untracked owner screenshots were left untouched.
- The parked CiteWire prototype, Karaya editorial-shadow proposal, and Karaya
  navigation work were left untouched.
- No secret, credential, provider activation, migration, production mutation,
  merge, deployment, DNS change, tag, publication, release, or registry action
  occurred during this refresh.

## Required refresh validation

- Parse `execution-state.yaml`, `recovery-ledger.yaml`, and `work-graph.yaml`.
- Verify exactly 17 briefs and dependency references.
- Run isolated-cache install, 119 committed tests, five release checks, syntax
  checks, secret/local-path scan, and `git diff --check`.
- Verify the PR-relative diff contains continuity artifacts only.
- Require fresh Node 18 and Node 22 CI before treating orchestration PR #1 as
  green.
