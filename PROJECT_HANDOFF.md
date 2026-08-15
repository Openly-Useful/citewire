# Citewire open-source program handoff

Verified at: 2026-08-15, America/New_York

This is the tracked, cross-repository source of truth for the next Claude Code
execution session. It is intentionally stored in the existing public Citewire
repository on `agent/citewire-orchestration-handoff`, stacked on the prepared
landing head `ff09b68ed811531eb0ca630b65daeaf06cc3304c`. The workspace root is not
a Git repository. Keeping the package here makes the handoff reviewable without
changing the exact diff of draft landing PR #2.

## Project identity

Citewire is a public, MIT-licensed, zero-dependency, Node 18+ ESM MCP package
for read-only news and research access. The current Community boundary is
stateless and provider-neutral. It supports stdio and Streamable HTTP, four
generic `news.*` tools when a platform adapter is configured, and ten optional
provider tools that are disabled by default.

The requested next product is broader:

- make Citewire a canonical, forkable open-source project under Openly Useful;
- preserve full Git history and keep the legacy repository readable as
  historical provenance;
- keep Karaya Industry News as a separate, customized consumer;
- add a rights-aware public MCP contract and resources;
- replace routine human review only after a deterministic, independently
  verified automated editorial path is proven;
- use an exceptions-only console, a global pause, and recurring assessments;
- evaluate `0.50-0.5999` items in shadow mode as `Adjacent signal` candidates
  with controlled reason tags;
- use citewire.org as the canonical landing page after it is actually live.

The current public identity is still `MeekPhills/citewire`, npm package
`citewire`, and MCP name `io.github.MeekPhills/citewire`. The proposed
`Openly-Useful/citewire` target is not visible, but GitHub privacy masking means
its availability is Unknown until an authorized organization-owner check.

## Local repositories

| Repository | Absolute path | Current verified branch and head | State |
| --- | --- | --- | --- |
| Citewire Community and landing | `/Users/luismorrobel/karayagroup/citewire` | `agent/citewire-orchestration-handoff` at `80017d60c4396d704e0be55af4cd9cb1dc548b94`, based on `ff09b68ed811531eb0ca630b65daeaf06cc3304c` | Focused handoff in draft PR #5; product PRs remain draft |
| Citewire Cloud | `/Users/luismorrobel/karayagroup/citewire-cloud` | `agent/cloud-alpha-http` at `69068275ca0e332e36304533aa0f6b5d2e291405` | Clean after docs sync; implementation base is `ad7e58f...`; exact Community archive pin is `10aee95...` |
| Openly Useful | `/Users/luismorrobel/karayagroup/openlyuseful.org` | `agent/citewire-site-link` at `28af5c7a5fdd0425ced2fe45f5c50e05946758de` | Clean draft link branch |
| Current Karaya link branch | `/Users/luismorrobel/karayagroup/karayagroup-citewire-site-link` | `agent/citewire-site-link` at `3a90e43d8797af9e7c0bc02d4c1ae6f51ebd19a6` | Clean and based on production main `9c150632...` |
| Karaya owner-asset worktree | `/Users/luismorrobel/karayagroup/karayagroup-brand` | `agent/citewire-product-bridge` at `60130c88...`, behind current main | Do not touch: 49 screenshots total, 41 untracked and 8 tracked |
| Historical Karaya feature worktree | `/Users/luismorrobel/karayagroup/karayagroup-live` | `1c63a389...`, 87 commits behind current main | Historical only; not production truth |

The parent directory `/Users/luismorrobel/karayagroup` is not a Git
repository. Its old `README.md` and `CLAUDE.md` contain durable Karaya safety,
redaction, voice, and owner-copy rules, but their one-page, no-database, and
never-deployed state claims are superseded by the live Karaya implementation.

## GitHub

| Repository | Active item | Verified state |
| --- | --- | --- |
| `MeekPhills/citewire` | PR #1 | Draft, mergeable, head `10aee95...`, base `main`; Node 18/22 workflow run `31750916990` succeeded |
| `MeekPhills/citewire` | PR #2 | Draft, mergeable, head `ff09b68...`, base `agent/citewire-product-launch`; runs `31849200115` and `31849291099` succeeded |
| `MeekPhills/citewire` | PR #5 | Draft, mergeable, head `80017d6...`, base `agent/citewire-landing-site`; exact 22-file orchestration-only diff |
| `MeekPhills/citewire` | Issue #3 | Canonical identity, history migration, website, and release; maps KAR-67 |
| `MeekPhills/citewire` | Issue #4 | Versioned public MCP contract and resources; maps KAR-68 |
| `MeekPhills/citewire-cloud` | PR #1 | Draft, mergeable, head `6906827...`; Node 18/22 runs `31893670759` and `31893673430` succeeded |
| `Openly-Useful/openlyuseful.org` | PR #8 | Draft, mergeable, head `28af5c7...`; runs `31849408964` and `31849412743` succeeded; preview passed |
| `MeekPhills/karayagroup` | PR #17 | Draft, mergeable, head `3a90e43...`; run `31849281233` succeeded; preview passed |
| `MeekPhills/karayagroup` | Issue #18 | Production truth and corpus integrity; maps KAR-69 |
| `MeekPhills/karayagroup` | Issue #19 | Automated editorial pipeline and exceptions console; maps KAR-70 |

No repository has a Git tag, release, or milestone. The open PRs remain draft.
No submitted review or unresolved review thread was visible during recovery.

## Linear

- Workspace: `lgam`
- Team: Karaya Group, ID `b9ad52e1-0bb5-45cb-8f60-827e281bca39`
- Initiative: Karaya Group, ID `53ec5c44-4833-4d3a-a146-982062147eaf`
- Project: `karaya-site · build, deploy, DNS, email path`, ID
  `cf2701e4-7c7c-4e46-941d-0d9f6332fff7`
- Parent program: KAR-66, In Progress
- Canonical identity/release child: KAR-67, Todo
- Public MCP contract child: KAR-68, Todo
- Production truth/corpus child: KAR-69, Todo; blocks KAR-70
- Editorial automation child: KAR-70, Todo; related to KAR-53
- Completed provenance: KAR-48 and KAR-36, Done
- Existing console/source-health follow-up: KAR-53, Backlog
- Dependency issue: KAR-24 is Todo as of 2026-08-15T15:52:24.535Z; linked PR
  #16 is merged
- Complete Launch Log document ID:
  `7f791900-c44b-489f-b0af-e1464784e367`

## Architecture

```text
Citewire Community
MIT / Node >=18 / ESM / stateless / read-only
stdio + Streamable HTTP + platform tools + optional provider tools
       |
       +-- exact archive dependency --> Citewire Cloud
       |                                private, account-scoped alpha
       |                                undeployed, stateful tools fail closed
       |
       +-- prepared static site ------> citewire.org
                                        currently parked and TLS-broken

Karaya Industry News
Vercel + Astro/serverless + Supabase app schema
public pages/API/feeds + anonymous read-only MCP + protected editorial console
uses vendored citewire@0.1-era provider adapters, not a current package import

Openly Useful
dependency-free static Vercel site and design-family reference
```

Community must not absorb Karaya credentials, source registry, editorial
state, voice rules, redactions, or proprietary policy. Cloud depends one-way on
Community. Karaya is a separate customized consumer with vendored-provider
provenance until a deliberate compatibility/update contract is approved.

## Environment setup and routine checks

### Community and landing

```text
cd /Users/luismorrobel/karayagroup/citewire
npm ci --ignore-scripts --no-audit --no-fund --cache /private/tmp/citewire-claude-cache
npm test
npm run release:check
npm pack --dry-run --json --cache /private/tmp/citewire-claude-cache
git diff --check
```

CI uses Node 18 and Node 22. Reuse committed release, protocol, provider, and
site regressions. Do not create ad hoc test artifacts in the repository.

### Cloud

```text
cd /Users/luismorrobel/karayagroup/citewire-cloud
npm ci --ignore-scripts --no-audit --no-fund --cache /private/tmp/citewire-cloud-claude-cache
npm test
npm run check
git diff --check
```

Reuse `test/http.test.mjs`, including direct HTTP, input allowlist, and
concurrent account-isolation regressions. Use account-isolation terminology.

### Karaya

Run from the current production-main-derived worktree's `site/` directory:

```text
npm ci
npm run build
npm test
node tools/check-registry.mjs
npm audit --omit=dev
```

Also run the repository's dependency gate, compliance grep, public HTTP routine
smokes, and MCP initialize/tools checks. Preserve every file under the separate
owner screenshot worktree.

### Openly Useful

```text
python3 scripts/validate_site.py
git diff --check
```

## Completed work

- Community provider-compliance candidate is complete at `10aee95...`.
- Cloud package and lockfile already pin `10aee95...`; do not repeat that edit.
- Cloud account-boundary repair and committed concurrent account-isolation
  regressions are complete at implementation base `ad7e58f...`. The four-file
  documentation reconciliation is pushed at `6906827...`; fresh Node 18/22 CI
  runs `31893670759` and `31893673430` passed.
- Karaya PR sequence #16 -> #15 -> #14 is complete; production main is
  `9c150632...`. Do not replay it.
- Karaya Industry News, nine-topic API, and public read-only MCP are live.
- Citewire landing, Openly Useful link, and Karaya link branches are pushed and
  CI-green, but remain draft.
- Four composite Linear children and four matching GitHub issues were created
  for the reviewed remaining work; active PR bodies carry work-stream mappings.

## Product decisions and constraints

- Preserve Community as MIT, zero-dependency, stateless, read-only, and Node
  18+ ESM.
- Keep providers disabled by default. No paid/metered provider or NewsData.io
  activation without an explicit provider, terms, budget, and failure-policy
  decision.
- Preserve Cloud as a separate private, account-scoped product boundary.
- Keep Karaya as a customized consumer with its own source policy, voice,
  redactions, labels, ranking, and presentation.
- "Remove review" means removing routine human review only after deterministic
  rights gates and independent automated verification are proven. Unknown
  rights, missing attribution, disagreement, low evidence, or provider failure
  must hold.
- Provisional shadow bands only: `<0.50` held, `0.50-0.5999` adjacent-only with
  automated agreement, `>=0.60` standard candidate. Current production remains
  `<0.55` quarantine, `0.55-0.8199` review, `>=0.82` auto-eligible.
- `Adjacent signal` and all visible reason tags require historical calibration
  and Luis's read-aloud approval before shipping.
- Jobs may report assessment findings. They must not silently change policy.

## Current behavior and known failures

Fresh on 2026-08-15:

- `https://karaya.group/industry-news` and `/industry-news/about` return 200.
- `GET /api/v1/news/topics` returns nine expected slugs.
- MCP initialize returns protocol `2025-06-18`, server `karaya-news-mcp`
  version `1.0.0`; tools/list returns 15 read-only tools.
- The public JSON feed returns 50 items. Sixteen summaries exceed the current
  480-character provisional cap and one retains an `appeared first on POWER
  Magazine` trailer. This proves stored-corpus policy drift, not a present
  ingest bypass.
- `http://citewire.org` serves a Porkbun parked-domain page. A separate check
  briefly saw 502. `https://citewire.org` consistently fails TLS. The stable
  conclusion is that the Citewire landing is not live or usable.
- Karaya migration files and handoffs contradict one another about migrations
  0007-0010. Production migration history, live source/circuit-breaker state,
  cron health, queue age, and runtime source count are Unknown.
- The former four-document Cloud pin drift is resolved at `6906827...` without
  changing runtime metadata or the future `^0.2.0` publication gate.

## Production-readiness gaps

P1:

- canonical GitHub/npm/MCP identity and legacy disposition are undecided;
- citewire.org is parked and TLS-broken;
- Community 0.2 is draft and unpublished;
- Karaya stored corpus does not fully match current policy;
- live Karaya migration/source/cron/queue truth is unresolved;
- Cloud is deliberately undeployed and has no participant, endpoint,
  persistence, OAuth, billing, retention, privacy, support, or rollback
  decision;
- automated editorial workflow, global pause, assessment cadence, and canary
  evidence do not exist.

P2:

- Community and Karaya MCP surfaces do not implement resources or the proposed
  decision-trace/inclusion contract;
- provider rate controls are process-local rather than distributed;
- `why_it_matters` is not structurally guaranteed for public items;
- Astro-chain audit exceptions expire on 2026-09-04;
- recurring cross-site availability monitoring is not verified.

## Critical path

```text
Identity and immutable release:
WS-002 canonical identity and authority
  -> WS-003 verified retain-in-place route or owner-approved history migration
  -> WS-008 separately approved immutable release and registry publication
WS-002 -> WS-004 identity-consistent Community candidate -> WS-008

Secure website and downstream links:
WS-002 + WS-004
  -> WS-005 identity-consistent landing + owner-approved HTTPS deployment
  -> WS-006 and WS-007 downstream links

WS-012 Karaya production truth and corpus integrity
  -> WS-014 policy/evaluation/shadow state machine
  -> WS-015 approved labels, exceptions console, pause, and assessments
  -> WS-016 owner-approved canary and production automation

WS-009 Cloud docs is independent.
WS-010 waits for WS-008.
WS-011 remains a separate owner-gated private-alpha path.
WS-013 may design the future MCP contract after identity is settled, but does
not block an accurately scoped 0.2 release.
```

## Active streams

The full structured graph is in `.claude/orchestration/work-graph.yaml` and
each stream has an executable brief under `.claude/orchestration/streams/`.

| ID | Objective | Priority | Tracker |
| --- | --- | --- | --- |
| WS-001 | Durable orchestration package | P0 | This branch and draft PR |
| WS-002 | Canonical identity and authority decision | P0 | Citewire #3, KAR-67 |
| WS-003 | Full-history canonical repository path | P0 | Citewire #3, KAR-67 |
| WS-004 | Community identity reconciliation and preflight | P0 | Citewire PR #1, KAR-67 |
| WS-005 | Landing identity, hosting, TLS, and verification | P0 | Citewire PR #2, KAR-67 |
| WS-006 | Openly Useful link activation | P1 | Openly Useful PR #8, KAR-67 |
| WS-007 | Karaya link activation | P1 | Karaya PR #17, KAR-67 |
| WS-008 | Immutable Community release and registry | P0 | Citewire PR #1/#3, KAR-67 |
| WS-009 | Cloud old-pin documentation repair, completed at `6906827...` | P1 | Cloud PR #1, KAR-66 |
| WS-010 | Cloud switch to verified npm artifact | P0 | Cloud PR #1, KAR-67 |
| WS-011 | Cloud private-alpha readiness | P1 | Cloud PR #1, KAR-66 |
| WS-012 | Karaya production truth and corpus integrity | P0 | Karaya #18, KAR-69 |
| WS-013 | Public MCP contract and resources | P1 | Citewire #4, KAR-68 |
| WS-014 | Editorial policy, corpus, and shadow state machine | P1 | Karaya #19, KAR-70 |
| WS-015 | Adjacent signal, console, pause, assessments | P1 | Karaya #19, KAR-70/KAR-53 |
| WS-016 | Canary and production automation rollout | P0 | Karaya #19, KAR-70 |

## Validation state

Fresh external GitHub reads verified current PR state and CI workflow results.
Fresh public HTTP/MCP/feed checks verified the production facts above. Local
Git refs and worktree status were rechecked. One Luna Conductor report drifted
to unrelated `GLO-*`/FantasyHQ data and was rejected in full; its corrected
report returned to the Citewire/Karaya scope and supplies the mappings above.

Synchronization is durable: draft Citewire PR #5 contains the 22-file handoff
package at `80017d60...` plus verified metadata-only follow-up; KAR-66 has the
PR/issue mappings and dated verification comment; KAR-48 has a provenance-only
comment and remains Done; and the complete Launch Log document
`7f791900-c44b-489f-b0af-e1464784e367` was fetched in full, appended, saved, and
re-read with the 2026-08-15 synchronization marker present.

No secret, private chat transcript, owner screenshot, deployment credential,
raw account key, or paid-provider configuration belongs in these artifacts.

## Deployment and release state

- Karaya production is live at main `9c150632...`.
- Openly Useful production is live; PR #8 is preview-only and draft.
- Citewire landing is not deployed to citewire.org.
- Citewire Community 0.2 is not merged, tagged, published, released, or in the
  official MCP Registry.
- Citewire Cloud is not deployed.
- No provider activation, migration, DNS change, source activation, automated
  production publication, npm publication, registry/catalog submission, or
  paid-service decision occurred in this orchestration session.

## Manual-only blockers

Luis must explicitly decide or approve:

1. canonical repository owner/path and legacy disposition;
2. npm and MCP Registry identity, `mcpName`, security/support URLs;
3. target organization authority and repository creation if moving;
4. Vercel project creation, domain attachment, DNS, TLS, deployment, rollback;
5. Community merge, release environment, vulnerability reporting, trusted
   publisher, tag, npm, GitHub Release, and MCP Registry steps;
6. read-only privileged Karaya production evidence access;
7. any corpus remediation or migration;
8. provider/model, terms, privacy/retention, budget, and failure policy;
9. visible `Adjacent signal` and reason-tag copy through read-aloud approval;
10. automation canary and production rollout.

## Initial parallel execution wave

The initial wave remains entirely inside WS-002. It does not start WS-003
through WS-016.

- Level 0 establishes the controlled baseline and owns the decision packet.
- A nested Fable session frames the retain-in-place and move-to-approved-org
  identity routes without selecting one.
- A Luna session independently verifies exact repository names, refs, PRs,
  namespace visibility, and available authority evidence.
- A Terra session independently reviews irreversible provenance, package,
  registry, hosting, and legacy-disposition consequences.
- The two independent reports return to Level 0. Neither reviewer owns packet
  implementation paths or may reuse the implementer's conclusions as proof.

## Two-hour Claude execution schedule

- T+0–30: revalidate the controlled baseline and independently frame/verify the
  two identity routes. No repository, metadata, link, hosting, or external
  mutation.
- T+30–60: Level 0 reconciles the reports into the canonical identity decision
  packet with explicit Unknowns, consequences, authority needs, and rollback
  boundaries.
- T+60–120: stop at Luis's identity decision gate. Do not start WS-003 through
  WS-016. Only correct factual errors in the WS-002 packet through the same
  independent review path.

## Exact first Claude action

Read `PROJECT_HANDOFF.md`, `CLAUDE.md`, and every file under
`.claude/orchestration/` in full before acting. Revalidate the recorded baseline:
all product worktrees except the protected Karaya owner-screenshot inventory
must be clean; that protected worktree is expected to contain its 41 untracked
screenshots. The Citewire orchestration checkout must
contain only the exact tracked handoff commit and no additional modified or
untracked path. Revalidate the protected Karaya inventory as exactly 49
screenshots, 8 tracked and 41 untracked. Do not stage, clean, move, edit, or
delete any of them. Revalidate exact heads, draft PR states, citewire.org
HTTP/TLS, and Karaya routine smoke evidence.

Execute WS-002 only. Produce the canonical identity decision packet comparing
retain-in-place and owner-approved move routes and their immutable consequences.
If Luis has not selected the identity and proven the required authority, stop
at that decision gate. Do not infer the choice from "Openly Useful" or from a
non-visible GitHub target.

The only permitted write is the cited WS-002 canonical identity decision
packet. It does not create authority for any external action. Do not alter
remotes, repository visibility, naming, security settings, branch protection,
GitHub settings, Vercel projects, hosting, certificates, workflow
configuration, or any external system. Do not merge, deploy, create or transfer
a repository, change DNS, tag, publish, release, submit a registry/catalog,
apply a migration, modify production data, enable a source/provider, select a
paid service, issue credentials, or ship visible Karaya copy. Stop before any
external mutation or irreversible action, even if it is not named above.
