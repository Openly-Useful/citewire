# Verification evidence — Citewire open-source program

Evidence date: 2026-08-15, America/New_York. Verified synchronization record for the Claude handoff. The Pickup phase was read-only; the reviewed synchronization phase created tracker mappings, updated draft PR descriptions, pushed the four-file Cloud documentation correction, and prepared this orchestration branch. It is not authority to merge, deploy, publish, activate providers, apply migrations, submit registries, or choose paid services.

## claim status

Verified means directly observed in local state, committed tests, GitHub/Linear reads, or dated live smoke. Historical means carried from an earlier verified run. Inferred means bounded interpretation. Unknown means not established. Contradicted means two sources disagree and the resolution is recorded below.

## exact local heads

| worktree | branch | head/status |
| --- | --- | --- |
| citewire | agent/citewire-orchestration-handoff | controlled handoff package based on ff09b68ed811531eb0ca630b65daeaf06cc3304c; before its focused commit only `.claude/`, `CLAUDE.md`, and `PROJECT_HANDOFF.md` are expected, and after commit the checkout must be clean at the recorded orchestration head |
| citewire release ref | agent/citewire-product-launch | 10aee95ac95bb437b4607723cd20fa5c8f9d1879, clean release candidate |
| citewire-cloud | agent/cloud-alpha-http | 69068275ca0e332e36304533aa0f6b5d2e291405, clean docs-aligned head; runtime baseline ad7e58f |
| karayagroup-brand | agent/citewire-product-bridge | 60130c88a3c89098736839bbd5e82c4af6ff9958, all 49 screenshots preserved: 41 untracked and 8 tracked |
| karayagroup-citewire-site-link | agent/citewire-site-link | 3a90e43d8797af9e7c0bc02d4c1ae6f51ebd19a6, clean |
| openlyuseful.org | agent/citewire-site-link | 28af5c7a5fdd0425ced2fe45f5c50e05946758de, clean |
| karayagroup-live | gmorrobel15/kar-35-wire-industry-news-pages-feeds-and-detail-routes-to-live | 1c63a3897317273d97c7bb4e71b0d283c5ff1bd6 |

## PRs and checks

- Citewire PR #1, head 10aee95a into main, draft/mergeable: Node 18/22 successful in 31750915019 and 31750916990.
- Citewire PR #2, head ff09b68 into agent/citewire-product-launch, draft/mergeable: Node 18/22 successful in 31849200115 and 31849291099; exact 20-file landing diff.
- Cloud PR #1, head 6906827 into main, draft/mergeable: Node 18/22 successful in 31893670759 and 31893673430; earlier runtime checks 31752801534 and 31752804098 successful; no deployment.
- Openly Useful PR #8, head 28af5c7 into current main cf137f9, draft/mergeable: validate runs 31849408964 and 31849412743 plus green Vercel preview.
- Karaya PR #17, head 3a90e43 into production main 9c150632, draft/mergeable: build-and-check 31849281233 plus green Vercel preview. It remains held because citewire.org is not live over HTTPS.
- Historical Karaya sequence: PR #16 into feature branch, PR #15 to main, PR #14 to main at 9c150632; main CI 31754108234 passed 408/408, 16-page build, registry/audit/compliance. This does not authorize PR #17.

## local verification

- Community release/landing branch: fresh isolated install, 70/70 committed tests, 5/5 release checks, 27-file npm dry run at 23,870 packed bytes, package excludes the landing and orchestration artifacts, and diff/secret checks. The first sandboxed suite run could not bind 127.0.0.1; the unchanged suite passed 70/70 with localhost binding permitted.
- Cloud runtime/docs: isolated install, 15/15 tests, syntax/check, direct HTTP smoke, concurrent account-isolation and input-allowlist regression, zero npm vulnerabilities, diff/secret checks. Commit 6906827 changes exactly four prose files.
- Karaya link: 409/409, 16-page build, registry/audit/compliance/diff/secret checks.
- Openly Useful: committed validator and diff checks.
- All tests reuse committed suites. No ad hoc test artifact was created.

## live evidence on 2026-08-15

- citewire.org HTTP returned 200 from openresty with X-Powered-By PHP/8.0.25 and X-Service pixie-default. HTTPS TLS handshake failed. A records were 207.207.210.107 and 207.207.210.229; no MX answer; SOA was under Porkbun/Cloudflare. The committed landing is not live. Openly-Useful/citewire was not visible in the authorized read check.
- Karaya /, /industry-news, /industry-news/about, and /api/v1/news/topics returned 200.
- Topics count was nine: ai-compute, data-centers, power-cooling, gpu-systems, cloud-colocation, capital-financing-ma, supply-chain, policy-governance, benchmarks-research.
- Karaya /mcp initialize succeeded with protocol 2025-06-18, server karaya-news-mcp 1.0.0, and read-only instructions.
- The observed 50-item JSON feed contained 16 summaries over the provisional 480-character cap and one appeared first on POWER Magazine trailer. Current code applies the cap, so this is classified as stored-corpus drift, not proof of gate bypass. Migration/source/cron/queue/revision state remains unknown pending WS-012.

## GitHub issues

- MeekPhills/citewire#3, canonical identity/history/release, maps to WS-002 through WS-008 and KAR-67: https://github.com/MeekPhills/citewire/issues/3.
- MeekPhills/citewire#4, versioned public MCP contract/resources, maps to WS-013 and KAR-68: https://github.com/MeekPhills/citewire/issues/4.
- MeekPhills/karayagroup#18, production truth/corpus integrity, maps to WS-012 and KAR-69: https://github.com/MeekPhills/karayagroup/issues/18.
- MeekPhills/karayagroup#19, automated editorial pipeline/exceptions console, maps to WS-014 through WS-016 and KAR-70: https://github.com/MeekPhills/karayagroup/issues/19.

## Linear

KAR-66 parent is In Progress. KAR-67, KAR-68, KAR-69, and KAR-70 are Todo. KAR-53 remains the related console/source-health/dedupe/dead-letter/kill-switch anchor. Launch Log document ID is 7f791900-c44b-489f-b0af-e1464784e367.

## contradiction resolutions

1. Cloud code/docs contradiction resolved by docs-only 6906827: all four docs now state the 10aee95a temporary pin and future npm gate.
2. Karaya code/feed contradiction is bounded as stored-corpus drift until WS-012 reads migration, source, cron, queue, and revision state. No silent rewrite.
3. Working Karaya GitHub link versus proposed citewire.org link remains unresolved: PR #17 stays draft until HTTPS landing and canonical identity verify.
4. Karaya vendored Community provider adapters are pass-through in its read-only MCP; this is not Cloud and not a broad powered-by claim.
5. Registry YAML counts are not runtime source truth; missing runtime state is Unknown.
6. GLO/fantasyhq material was rejected as unrelated to Citewire/Karaya. No GLO issue, fantasyhq migration, branch, or deployment was used or changed.

## explicit actions not taken

- No Openly-Useful/citewire creation, transfer, archive, fork, or rename.
- No Citewire Vercel project, DNS/domain attachment, citewire.org repair, landing deployment, merge, tag, GitHub Release, npm publish, MCP Registry/catalog submission.
- No Cloud deployment, participant invite, credential issuance/rotation, provider/model/cost choice, paid service, billing, OAuth, or public-availability claim.
- No Karaya migration, database write, source toggle, provider activation, production threshold change, automated publishing, canary, or corpus rewrite.
- No visible Karaya copy change or merge without Luis read-aloud approval.
- No owner screenshot edit, stage, delete, clean, or overwrite. All 49 screenshot files remain preserved: 41 untracked and 8 tracked.
- No unrelated GLO/fantasyhq mutation.

## handoff gate

The initial two-hour gate is WS-002 only: obtain the canonical identity and authority decision before repository migration, release metadata, landing deployment, or immutable publication. WS-012 is an independent later read-only branch and is not launched in that wave. After corpus integrity, the Karaya order is WS-014 shadow policy/replay, WS-015 exceptions console/assessments, then WS-016 canary only after explicit owner approval. WS-009 records the verified exact archive pin; WS-010 is the blocked post-publication npm-range migration; WS-011 is a separate owner-gated archive-pinned private-alpha path. Stop on failed tests, unexpected diff, secret, paid-service decision, provider activation, migration, deployment, or irreversible action.
