# CiteWire program handoff

Verified 2026-08-23 in America/New_York. This portable checkpoint records
reproducible repository, GitHub, Linear, CI, HTTPS, and read-only production
observations. It contains no credentials, private transcript, local path, or
machine-specific identifier.

## Outcome

CiteWire is now a public Openly Useful project with a live canonical website
and merged, inert product foundations. The remaining work is activation and
integration work behind explicit gates, not creation of the core foundations.

| Area | Verified state | Next gate |
| --- | --- | --- |
| Community | Main `e12d9b6`; 119 tests; 5 release checks | Keep contracts backward-compatible |
| Website | `https://citewire.org/` returns HTTPS 200 | None for availability |
| Source registry | Merged; rights metadata and defaults are fail-closed | Operator-controlled enablement only |
| RSS and MCP | Merged projections with attribution and canonical links | No provider activation by default |
| Studio | Optional local management foundation merged | No hosted control plane or real credentials |
| Connectors | Credential-reference and endpoint-policy boundaries merged | Explicit operator setup and security review |
| Classifier | Deterministic calibration foundation merged | Shadow evaluation before any policy change |
| Editorial engine | Fail-closed shadow state machine merged | No automatic publishing |
| npm and registries | npm latest is `0.1.0`; no tag or release | Separate immutable-release approval |
| Cloud | Draft PR #1, head `6906827`, 15 tests, Node 18/22 green | Remain undeployed; later npm migration |
| Openly Useful link | Draft PR #8, head `e48d606`, clean and green | Separate merge approval |
| Karaya link | Draft PR #17, head `004a8e0`, 432 tests and CI green | Luis read-aloud approval, then merge approval |
| Karaya automation | KAR-69 remains In Progress | Complete read-only production truth first |

## Repository and tracker truth

- Public foundation PRs #6, #7, and #8 merged into canonical main on
  2026-08-16. Earlier identity, release-candidate, and landing work landed via
  PRs #2, #3, and #4.
- OU-145 and OU-180 through OU-183 are Done because their defined inert
  foundation scopes are present on main and verified by the committed suite.
- OU-143 remains In Progress as the launch parent.
- OU-149 remains Todo because package publication and ecosystem distribution
  are immutable, separately approved actions.
- The legacy private Karaya integration remains a customized consumer and does
  not define Community policy.

## Karaya production observation

Read-only verification on 2026-08-23 found 49 registered sources, 27 monitored
sources, and 22 directory-only sources. Six items were visible in the seven-day
window. The newest published item was approximately 60.6 hours old. Production
logs showed successful `POST /api/cron/ingest` requests at 15-minute cadence,
so the freshness gap is not evidence of a missing cron. Source-level fetch
results, queue age, held volume, and migration state remain unknown. Continue
KAR-69 before changing policy, thresholds, sources, or data.

## Protected state

- Preserve 41 untracked owner screenshots. Do not stage, move, edit, clean, or
  delete them.
- Preserve the dirty Karaya editorial-shadow proposal without applying its
  migration or granting completion credit.
- Preserve the dirty parked CiteWire prototype without staging or merging it.
- Preserve the separate in-progress Karaya navigation worktree.

## Next safe sequence

1. Validate and keep this orchestration refresh as draft PR #1.
2. Obtain separate approval before merging Openly Useful PR #8.
3. Read the exact visible Karaya PR #17 copy aloud to Luis and obtain approval
   before merge or production verification.
4. Complete KAR-69 read-only production truth. Then design Karaya shadow
   policy, exceptions console, and reversible canary in that order.
5. Treat Community `0.2.0` package publication, GitHub release, MCP registry,
   connector activation, Cloud deployment, and automatic editorial publishing
   as separate immutable or production-changing gates.

## Validation commands

```sh
npm ci --cache "$(mktemp -d)"
npm test
npm run release:check
find src test apps -type f \( -name '*.js' -o -name '*.mjs' \) -print0 \
  | xargs -0 -n1 node --check
git diff --check
```

Parse both orchestration YAML files, verify exactly 17 stream briefs, and
compare the PR against current main before pushing. CI must pass on Node 18 and
Node 22. Do not create ad hoc regression artifacts.
