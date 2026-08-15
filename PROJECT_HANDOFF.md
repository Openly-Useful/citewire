# CiteWire program handoff

Verified local baseline: 2026-08-15, America/New_York.

This is the tracked source of truth for the current 17-stream CiteWire,
Cloud, Openly Useful, and Karaya program. It is a control package, not
authorization for a repository operation, publication, hosting, deployment,
database change, or visible Karaya copy change.

## Current control facts

- Pre-synchronization CiteWire orchestration baseline is
  7e816c5b2900cb04309f751e5d93bab79752128a. The first reviewed 17-stream
  synchronization commit is 4b04c4c448f44b07f8fc10a4e2211274d7c55ee8.
  Read the live draft PR #5 head before acting; this metadata cannot embed its
  own resulting commit SHA.
- 80017d60c4396d704e0be55af4cd9cb1dc548b94 is historical initial-package
  evidence only.
- Visible brand: CiteWire. Technical token: citewire. Project parent: Openly
  Useful.
- Openly-Useful/citewire is authenticated absent and unapproved. Absence does
  not authorize creation, transfer, mirror, archive, rename, package or
  registry identity, citewire.org operations, or Cloud tenancy/operator work.
- All remote PR, CI, GitHub, Linear, DNS, hosting, and deployment references
  are recorded historical state pending fresh remote revalidation before action.

## Controlled exceptions

- citewire/.project-status/manifest.json is a controlled untracked proposal.
  Preserve it unstaged and exclude it from this orchestration commit. CiteWire
  is not Git-clean until it is separately dispositioned.
- citewire-public-platform is a dirty parked prototype at 7e816c5. Do not
  merge, stage, clean, cherry-pick, or credit it to WS-013 or WS-017.
- karayagroup-editorial-shadow is a dirty preserved proposal at 9c150632. Do
  not commit its migration or credit it to WS-014 or WS-015.
- karayagroup-production-audit is absent. Create it as a fresh clean isolated
  worktree from verified origin/main before WS-012. Do not substitute live,
  brand, or editorial-shadow.
- karayagroup-brand/site/handoff/redesign contains 49 protected screenshots,
  8 tracked and 41 untracked. Never edit, stage, clean, move, delete, or use
  them as a baseline.

The public-platform prototype is parked because it changed runtime behavior
before the WS-013 ADR, Studio is not defensibly authenticated, pause does not
gate every write, record cleanup is shallow, registry input is unvalidated, a
publish seam exists, and package contents exclude Studio. Studio, plugins, and
hosted control-plane work are speculative and have no required stream.

The editorial-shadow proposal is preserved without credit because it has an
executable migration before production truth, lacks bounded replay/window
identity and deterministic corpus traversal, does not converge safely on
concurrent/partial writes, and has a CiteWire vendor-version contradiction.
Its focused verification stopped after 21 passing tests when one test file
could not load `@supabase/supabase-js`; the isolated worktree had no installed
dependencies and the shell was Node v24.18.0 rather than the required Node 22.
No install, rerun, build, audit, commit, migration, or deployment followed.
WS-012 reconciles its vendor preimage, commit, version, customizations, and
behavior/terms delta before WS-014.

## Recorded repository and tracker state

- CiteWire orchestration: pre-sync baseline 7e816c5; first reviewed 17-stream
  sync 4b04c4c; live branch head must be re-read.
- Community candidate: agent/citewire-product-launch at 10aee95, recorded
  CiteWire PR #1 draft.
- Landing: agent/citewire-landing-site at ff09b68, recorded CiteWire PR #2
  draft.
- Orchestration package: recorded CiteWire PR #5 draft.
- Cloud: agent/cloud-alpha-http at 6906827, recorded Cloud PR #1 draft and
  archive pin 10aee95.
- Openly Useful link: recorded PR #8 draft at 28af5c7.
- Karaya CiteWire bridge: recorded PR #17 draft at 3a90e43.
- Identity/release: recorded CiteWire issue #3 and KAR-67 Todo.
- Public Community contract: recorded CiteWire issue #4 and KAR-68 Todo.
- Karaya production truth: recorded Karaya issue #18 and KAR-69 Todo.
- Karaya automation: recorded Karaya issue #19 and KAR-70 Todo. KAR-53 is
  related console/source-health context.
- KAR-66 is the recorded In Progress program parent. KAR-71 and KAR-77 are
  context only, not stream mappings, dependencies, or authority.
- KAR-48 and KAR-36 are recorded Done provenance/history. KAR-24 is recorded
  Todo; linked PR #16 does not prove the Astro-major-upgrade dependency done.
  These are context-only, not active CiteWire stream mappings.
- No verified CiteWire Cowork/plugin manifest or GitHub/Linear work item maps
  to a required stream. Studio/plugin work remains speculative.

Fresh synchronization evidence on 2026-08-15: draft PR #5 was verified at
4b04c4c with Node 18/22 CI green in runs 31906699682 and 31906701652; CiteWire
issues #3/#4 and Karaya issues #18/#19 contain the synchronization comments;
KAR-66 through KAR-70 were re-read after their updates; and the complete
Launch Log was re-read with exactly one appended 17-stream marker. These are
tracking-only changes, not product completion evidence.

## Product boundary

Community CiteWire is MIT, zero-dependency, Node 18+ ESM, stateless, read-only,
provider-neutral, attribution-first, and provider-disabled by default. It must
not contain Karaya credentials, source configuration, editorial policy,
redactions, historical state, or Cloud tenancy.

Cloud is a distinct private account boundary that consumes Community one way.
It is not an implicit CiteWire, Openly Useful, or Karaya account namespace.
Its participant, credential, support, privacy, origin, billing, retention, and
deployment decisions remain separate owner gates.

Karaya is a separate customized consumer. Its safety path is WS-012 to WS-014
to WS-015 to WS-016.

## The 17-stream graph

1. WS-001 controls the documentation package.
2. WS-002 records identity facts and unresolved authority.
3. WS-003 verifies the owner-selected repository/history route.
4. WS-004 re-verifies the existing Community candidate.
5. WS-005 verifies the live CiteWire HTTPS destination.
6. WS-006 activates the Openly Useful link after WS-005.
7. WS-007 activates the Karaya link after WS-005 and read-aloud approval.
8. WS-008 is the immutable release path and depends on WS-003, WS-004, and
   WS-005.
9. WS-009 is complete evidence-only Cloud documentation alignment.
10. WS-010 changes Cloud to npm only after WS-008.
11. WS-011 depends directly on WS-002 and WS-009.
12. WS-012 records read-only production truth from a new clean worktree.
13. WS-013 is an ADR-only public MCP contract design.
14. WS-014 owns non-publishing shadow policy after WS-012.
15. WS-015 owns authorized controls/UI after WS-014.
16. WS-016 owns canary/rollout after WS-015.
17. WS-017 is the only new required stream. It implements the approved
    Community contract after WS-004 and WS-013. It excludes Studio, plugins,
    hosting, accounts, persistence, scheduling, credentials, publishing, and
    every Karaya behavior.

No stream may write outside its explicit path lease. WS-004 owns current
candidate metadata but not future Community runtime/test paths; WS-017 owns
the later runtime contract paths. WS-009 is evidence-only, so WS-011 owns
future mutable Cloud readiness documentation. WS-012 writes only its truth
packet; WS-014 owns policy/shadow paths, WS-015 owns admin/UI/control paths,
and WS-016 owns rollout/configuration/runbook paths.

## Critical paths

- Identity, live website, immutable release, Cloud npm:
  WS-001 → WS-002 → WS-003 and WS-004 → WS-005 → WS-008 → WS-010.
  WS-008 waits for all of WS-003, WS-004, and WS-005.
- Live HTTPS links:
  WS-001 → WS-002 → WS-004 → WS-005 → WS-006 and WS-007.
- Future Community contract:
  WS-001 → WS-002 → WS-013, together with WS-004, then WS-017.
  WS-017 does not block the 0.2 release path; a later release is separately
  owner-approved.
- Cloud private alpha:
  WS-001 → WS-009 and WS-002 → WS-011.
- Karaya production safety:
  WS-001 → fresh production-audit worktree → WS-012 → WS-014 → WS-015 →
  WS-016.

## Initial wave and two-hour plan

Phase 0 is WS-001 only: synchronize and mechanically validate the 17-stream
package.

After WS-001, WS-002 may build a documentation-only identity packet. In
parallel only after a fresh clean production-audit worktree exists, WS-012 may
collect public/local read-only evidence. No other stream may begin.

- Minutes 0–15: confirm the live head and the 7e816c5 pre-sync baseline plus
  controlled exceptions; independent
  path/ref check.
- Minutes 15–40: synchronize WS-001 and prepare WS-002 decision record.
- Minutes 40–60: independent review of dependencies, leases, historical
  labels, and stops.
- Minutes 60–75: conditionally create and record clean production-audit
  worktree, otherwise preserve the WS-012 block.
- Minutes 75–120: conditionally collect WS-012 public/local read-only
  evidence and vendor-provenance reconciliation.

## Hard stops

Stop for a failed check, unexpected diff, secret, protected asset, owner
overlap, repository create/transfer/archive/rename, DNS/domain/TLS action,
hosting/deployment, merge, tag, publication, registry/catalog action, provider
activation, migration, production-data/configuration mutation, paid-service
decision, Studio/plugin scope expansion, or visible Karaya copy without Luis
read-aloud approval.

The executable per-stream contracts, checks, artifacts, rollbacks, mappings,
reviewers, and first actions are in work-graph.yaml and WS-001 through WS-017.
