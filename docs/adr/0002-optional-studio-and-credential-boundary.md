# ADR 0002: Optional Studio and credential-reference boundary

- Status: Proposed implementation for review
- Date: 2026-08-16
- Base: `codex/public-foundation`

## Context

CiteWire Community is a stateless, dependency-free MCP server with a reviewed
source registry, fail-closed rights evaluation, and a shadow-only classifier.
Operators also need an account-scoped place to inspect exceptions, assessment
posture, and connector configuration without turning the Community package into
an authenticated hosted service.

## Decision

Keep Studio in `apps/studio` as an optional reference application. The root
package does not import it, export it, include it in the package allowlist, or
start it. Studio accepts a trusted principal from a deployment-owned session
boundary and derives storage scope exclusively from that principal. Personal
and organization accounts use a typed tuple so equal text identifiers never
collide.

The included memory adapter is for tests and local evaluation. It starts with a
global pause enabled, supports account-scoped idempotent mutations, and records
redacted audit events. Only a principal with the system operator role can
change the global pause.

Connector configurations refer to reviewed source and adapter identifiers.
They accept only opaque environment or secret-manager references and never
return their locations. Connectors remain disabled and make no network calls.
The current source registry has no reviewed `allowed_origins`, so connector
definitions must remain endpointless.

## Security properties

- Raw credentials and recursively nested secret-like fields are rejected.
- Credential references are redacted from responses and audit records.
- Caller-supplied account identifiers cannot replace the trusted scope.
- No connector activation, provider execution, scheduler, or publication route
  exists.
- Assessment definitions are inspectable but their execution is disabled.
- Endpoint validation is exact-origin and HTTPS-only, but cannot by itself
  solve DNS rebinding. Runtime network enforcement remains a future gate.

## Consequences

Self-hosters gain a small, inspectable account-aware control-plane contract
without selecting an authentication vendor, database, secret manager, or host.
The reference application is not production-ready: durable account isolation,
shared global pause, tamper-evident audit, authenticated same-origin sessions,
CSRF protection, and network egress controls remain deployment requirements.

## Rollback

Remove `apps/studio`, `src/security`, the Studio documentation, and their tests.
The Community MCP surface and all existing provider tools remain unchanged.
