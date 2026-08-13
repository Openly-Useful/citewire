# Governance

citewire is a small open-source project with a maintainer-led decision model.
The goal of this policy is to keep Community useful, attribution-first,
technically focused, and safe to adopt without creating unnecessary process.

## Scope

This policy governs the MIT-licensed citewire repository, including:

- The MCP core and transports.
- Configuration and public JavaScript exports.
- The compatible-platform contract and `news.*` tools.
- Public provider adapters.
- Tests, examples, release metadata, and documentation.
- Community product boundaries and ecosystem distribution records.

Code for a separate hosted or commercial service is outside this repository's
governance unless it is expressly contributed here under the MIT license.

## Roles

### Users

Users run citewire, report defects, ask questions, and propose improvements.
Using the project does not require participation in governance.

### Contributors

Contributors submit issues, documentation, tests, code, or reviews. A merged
contribution does not automatically grant release or maintainer authority.

### Maintainers

Maintainers review contributions, resolve scope questions, make releases,
manage repository settings, and protect the project's legal and product
boundaries. Maintainers have final responsibility for decisions in this
repository.

The current repository permissions are the operational source of truth for who
can merge or release. This document does not publish a fixed maintainer roster
that could become stale.

## Decision process

Most decisions happen in a GitHub issue or pull request.

1. State the problem and the user impact.
2. Describe the proposed change, alternatives, and compatibility effects.
3. Gather technical evidence and contributor feedback.
4. Seek practical consensus among affected contributors.
5. A maintainer records the decision by merging, closing with rationale, or
   requesting a revised proposal.

Maintainers may make routine fixes directly when the change is narrow,
reversible, tested, and consistent with documented policy.

## Major changes

Open an issue before implementation when a proposal would:

- Break a public export, config field, tool name, tool schema, or transport.
- Change the platform read-API contract.
- Remove or materially narrow a provider adapter.
- Add persistent state, accounts, telemetry, or write operations to Community.
- Add a runtime dependency.
- Change the MIT license or contribution terms.
- Change the Community and commercial capability boundary.
- Change this governance policy.

A major proposal should include migration impact, security and privacy effects,
test strategy, documentation changes, and a rollback or deprecation plan where
applicable.

## Community guarantees

The maintainers govern Community according to these commitments:

1. **Useful under MIT.** Community includes a functional MCP core, transports,
   compatible-platform tools, and every maintained provider adapter in this
   repository.
2. **Provider parity.** An adapter is not removed, withheld, degraded, or capped
   merely to sell access to the same free provider through a commercial
   service.
3. **Self-hostable.** Community remains runnable without a required citewire
   account or a mandatory hosted control plane.
4. **No mandatory telemetry.** Adoption of Community does not require sending
   usage data to a citewire-operated service.
5. **Additive commercial value.** Managed operations, personalization,
   workflows, collaboration, retained history, and support are appropriate
   commercial differentiators.
6. **Essential maintenance stays open.** Security fixes, provider correctness
   fixes, and protocol compatibility work for Community are not premium gates.

The detailed boundary is in [Product tiers](product-tiers.md).

## Provider stewardship

### Acceptance criteria

A provider adapter should:

- Serve a clear news, research, or attribution-related use case.
- Use a documented upstream read API.
- Link to the provider's own API documentation.
- Record the free-access basis and known courtesy limits without overstating
  permission.
- Ship disabled by default.
- Return source metadata and links without storing or republishing source
  content.
- Avoid bypassing authentication, paywalls, access controls, or technical
  restrictions.
- Include deterministic tests that do not require live upstream access.
- Preserve the zero-runtime-dependency rule unless a major proposal is
  approved.

### Deprecation and removal

A provider may be deprecated or removed when:

- The provider closes or materially changes the relevant API.
- Current terms no longer support the adapter's documented use.
- The adapter creates a legal, safety, security, or privacy concern.
- The adapter cannot be maintained reliably with the project's architecture.
- A replacement makes the old adapter redundant and a migration path exists.

When practical, removal should include:

1. A public issue stating the evidence and reason.
2. A deprecation notice in `docs/providers.md`.
3. A migration path or replacement recommendation.
4. A release note and an appropriate version change.

An urgent legal or security issue may require immediate disablement or removal.
The maintainers should publish as much rationale as can be shared safely.

Commercial positioning is not a valid reason by itself to remove a Community
provider.

## Compatibility and releases

- Tool names, input schemas, config fields, and exported module paths are public
  contracts.
- Backward-compatible additions should include tests and documentation.
- Breaking changes require a major proposal, migration guidance, and versioning
  that signals the impact.
- A release should pass `npm test` on a supported Node version.
- Published package metadata, Git tags, release notes, registry manifests, and
  documentation should describe the same version.
- A catalog entry is not marked complete until its public record has been
  verified. See [Distribution](distribution.md).

## Attribution, privacy, and terms

citewire is attribution-first. Changes should preserve publisher and provider
credit, source URLs, and rights notices supplied by the upstream response.

Community is intentionally stateless. A proposal that adds retention,
identities, or telemetry must address data minimization, user control,
security, disclosure, and deletion before implementation.

Provider documentation is informational, not legal advice. Contributors must
not claim that a reachable endpoint grants permission for every use case.

## Licensing and contributions

Community is distributed under the MIT license. Contributions accepted into
this repository are distributed under the same license. Existing MIT releases
cannot be retroactively withdrawn from recipients or converted into a more
restrictive license.

The project does not require assignment of contributor copyright through this
document. Contributors must have the right to submit their work and must not
include code, content, or data under incompatible terms.

## Commercial interests and conflicts

Maintainers and contributors may work on commercial products related to
citewire. When a commercial interest materially affects a proposal, it should
be disclosed in the issue or pull request. A maintainer should seek another
reviewer when a conflict would reasonably call the decision's fairness into
question.

Commercial work may fund Community maintenance. It must still respect the
Community guarantees in this document.

## Security decisions

Do not disclose an unpatched vulnerability in a public issue. Follow the
private-reporting guidance in [SECURITY.md](../SECURITY.md). Maintainers may
handle a security fix privately until users can update, then publish an
appropriate advisory or release note.

## Amendments

Changes to this document require a public issue or pull request that states why
the current policy is insufficient and how the amendment affects users,
contributors, and the Community boundary. A maintainer must approve the final
text. Governance changes must not be hidden inside an unrelated pull request.
