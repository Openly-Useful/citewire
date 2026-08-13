# Product tiers

This document defines the product boundary between citewire Community and
commercial citewire services. It is a scope policy, not an announcement of a
hosted service, release date, price, service level, or support plan.

## Product principle

Community must remain a complete, useful way to run attribution-first MCP tools
for news and research metadata. Commercial value comes from operating the
software and adding stateful team experiences around it. It does not come from
removing providers, imposing artificial provider limits, or making the open
server deliberately difficult to use.

## Community

Community is the MIT-licensed code in this repository. It is designed for
individual users, developers, researchers, news platform operators, and teams
that prefer to self-host.

Community includes:

- The implemented MCP JSON-RPC core and typed tool interface.
- stdio transport for locally launched MCP clients.
- Stateless HTTP transport and the reusable Node HTTP handler.
- The configuration loader and validation behavior.
- The generic compatible-platform adapter and all four `news.*` tools.
- Every maintained public provider adapter in this repository.
- Provider-only, platform-only, and combined configurations.
- Tests, examples, provider documentation, and the public platform contract.
- The right to use, copy, modify, distribute, sublicense, and sell the software
  under the MIT license.

Community has no built-in account system, persistent storage, shared workspace,
saved history, or managed control plane. Those are architectural boundaries,
not defects inserted to force an upgrade.

## Commercial services

Commercial citewire services may add value in the following areas. These are
product directions and do not state that a particular feature or service is
currently available.

### Hosted operations

- Managed deployment and upgrades.
- Runtime configuration and environment management.
- Monitoring, operational diagnostics, and recovery workflows.
- Capacity management and infrastructure safeguards.
- Managed provider and platform connection setup.

### Personalization

- Saved topics, sources, industries, and query preferences.
- Personal relevance settings and filtering profiles.
- Watchlists, saved items, and delivery preferences.
- User-specific views over the same underlying provider tools.

### Workflows

- Scheduled searches, briefs, and digests.
- Routing to approved destinations and downstream systems.
- Review, approval, and escalation steps.
- Reusable workflow templates and automation controls.

### Collaboration

- Shared workspaces and team configuration.
- Roles, permissions, and administrative controls.
- Shared lists, saved research, annotations, and handoffs.
- Team-level source and topic policies.

### History

- Retained searches, results, saved items, and generated briefs.
- Change history for workspace settings and workflows.
- Audit records appropriate to the service's documented retention policy.
- Export and deletion controls defined for the hosted service.

### Support

- Onboarding, migration, and configuration assistance.
- Operational support for hosted deployments.
- Contract-specific response targets or service commitments when expressly
  agreed.

## Capability boundary

| Capability | Community | Commercial service direction |
| --- | --- | --- |
| MCP core and tool schemas | Included under MIT | Operated as part of a managed service |
| Compatible-platform tools | Included under MIT | Managed configuration and operations |
| Public provider adapters | All maintained adapters included under MIT | The same provider capabilities with managed operation |
| stdio and HTTP transports | Included under MIT | Managed endpoints and infrastructure |
| Self-hosting | Supported by source, examples, and docs | Deployment assistance may be offered |
| Personal preferences | Local config only | Saved user profiles and delivery preferences |
| Workflows | Build externally around Community | Scheduled and managed workflow features |
| Collaboration | Build externally around Community | Workspaces, roles, sharing, and controls |
| History | No retained state in the core | Retention, search, export, deletion, and audit features |
| Support | Community issues and documentation | Contracted onboarding and operational support |

## What will not be used as a premium gate

The following Community capabilities must not be removed, delayed, degraded, or
artificially limited to create an upgrade incentive:

- Access to a maintained provider adapter.
- The number of provider adapters that can be enabled.
- The generic `news.*` platform tools.
- stdio or stateless HTTP operation.
- Local configuration and self-hosting.
- Security fixes, protocol compatibility fixes, and essential maintenance.
- Documentation needed to run or extend Community.

A provider may still be deprecated or removed for a documented legal, safety,
upstream-terms, technical, or maintenance reason. It must not be removed merely
to make the provider available only through a paid service. The process is
defined in [Governance](governance.md).

## Shared provider policy

Community and any commercial service should use the same public provider tool
definitions when they represent the same upstream capability. A hosted service
may add caching, policy controls, monitoring, saved state, or workflow context,
but it should not misrepresent those operational features as exclusive access
to a provider that Community already supports.

Provider access remains subject to each provider's current terms, rate limits,
and availability. A commercial relationship with citewire does not grant rights
from an upstream provider.

## Packaging and communication rules

- Use **citewire Community** for the MIT-licensed repository and package.
- Describe any commercial offering by what it adds, such as hosted operation or
  shared workflows.
- Do not publish a price, launch date, uptime statement, service level, customer
  count, usage metric, or catalog status unless it is approved and verifiable.
- Do not call a planned capability available.
- Do not describe Community as a trial, demo, or limited provider edition.
- Link to this document when a product surface compares Community and a
  commercial service.

## Changing this boundary

Any change that could reduce Community utility or move an existing Community
capability behind a commercial gate is a major governance change. It requires a
public proposal and explicit maintainer rationale under
[Governance](governance.md). Existing MIT releases remain available under their
original license.
