# CLAUDE.md

This repository is the tracked orchestration home for the cross-repository
Citewire open-source program. Read `PROJECT_HANDOFF.md` and every file under
`.claude/orchestration/` before acting.

Community Citewire must remain MIT licensed, zero-dependency, stateless,
read-only, provider-neutral, and Node 18+ ESM unless Luis explicitly approves a
versioned public-contract change. Providers stay disabled by default.

Use routine smoke tests, committed regression tests, and account-isolation
terminology. Do not create ad hoc repository test artifacts. Preserve the
Community-to-Cloud one-way dependency and Karaya's separate customized policy.

<!-- FABLE-ORCHESTRATION:BEGIN -->
## Managed Fable orchestration block

Last synchronized: 2026-08-15

### Authority

- Sol parent orchestrator is the Level 0 Fable master. "Sol parent
  orchestrator" and "Fable L0 master" are the same authority, not separate
  approvers or executors.
- Level 0 Fable master owns global truth, dependency release, integration,
  GitHub/Linear synchronization, and stop/go judgment.
- Nested Fable orchestrators own composite clusters only after Level 0 releases
  their dependencies.
- Opus owns architecture, security, privacy, data integrity, migrations,
  cross-repository changes, root-cause analysis, and critical review.
- Sonnet owns bounded implementation, tests, fixtures, docs, accessibility,
  CI/build repairs, deterministic verification, and runbooks.
- Implementers never serve as their own sole independent reviewer. When an
  owner and reviewer use the same model tier, they must be separate
  agents/sessions. The reviewer has no write ownership of the implementation
  paths, does not reuse the implementer's conclusions as evidence, and reports
  to Level 0 before integration. An implementer may never self-approve.

### Source of truth

1. Luis's latest explicit direction.
2. Current implementation and reproducible behavior.
3. Fresh tests, CI, deployment, and production evidence.
4. Git history and reviewed diffs.
5. Current GitHub and Linear state.
6. Current documentation.
7. Historical discussion.

Classify material claims as Verified, Historical, Inferred,
Unknown, or Contradicted. Never treat a closed issue, commit message, old
handoff, or agent report as fresh proof.

### Execution rules

- Follow `.claude/orchestration/work-graph.yaml`; do not skip dependencies.
- Every agent gets one repository or non-overlapping owned paths, binary
  acceptance criteria, required checks, rollback, reviewer, and escalation.
- Keep all Citewire, Cloud, Openly Useful, and Karaya product PRs draft until
  their exact owner gates are satisfied.
- Canonical identity precedes immutable package or MCP Registry publication.
- Karaya production truth and corpus integrity precede threshold reduction or
  automated publishing.
- Unknown rights, missing attribution, agent disagreement, low evidence, and
  provider failures hold rather than publish.
- Jobs may report policy drift. They may not silently mutate policy.
- Preserve all 49 Karaya screenshot files in the separate owner worktree:
  41 untracked and 8 tracked. Never clean, stage, move, rewrite, or delete them.

### Hard stops

Stop on a failed test, unexpected diff, secret, target collision, overlapping
owner edit, paid-service decision, provider/source activation, migration,
production-data change, repository creation/transfer/archive, DNS/domain/TLS
change, deployment, merge, tag, npm/GitHub Release/MCP Registry/catalog action,
or visible Karaya copy without the required exact owner approval.

### Initial action

Revalidate the recorded baseline: all product worktrees except the protected
Karaya owner-screenshot inventory must be clean. The protected worktree has the
expected 41 untracked screenshots. The
Citewire orchestration worktree may contain only this controlled handoff
package and its exact orchestration commit; stop on any additional modified or
untracked path. Revalidate the protected Karaya inventory as exactly 49
screenshots, 8 tracked and 41 untracked. Do not stage, clean, move, edit, or
delete any of them.

Then execute WS-002 only: prepare the canonical identity decision packet. Do
not launch WS-012 during the initial two-hour wave; it remains an independent
later read-only branch that requires Level 0 authorization. If Luis has not
made the identity choice, stop at the decision gate. Do not infer it from the
phrase "Openly Useful" or from a non-visible GitHub target.

The only permitted write in this initial wave is the cited WS-002 canonical
identity decision packet. It does not create authority for any external
action. Do not alter remotes, repository visibility, naming, security settings,
branch protection, GitHub settings, Vercel projects, hosting, certificates,
workflow configuration, or any external system. Stop before any external
mutation or irreversible action, even if it is not named above.
<!-- FABLE-ORCHESTRATION:END -->
