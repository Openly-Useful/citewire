# Source registry and rights foundation

CiteWire Community includes a conservative, machine-readable source registry.
The registry is policy metadata, not a crawler list: every bundled source has
`enabled_by_default: false`, and enabling the Community policy surface does not
contact a source, load credentials, or activate a provider.

The registry schema is
[`src/community/source-registry.schema.json`](../src/community/source-registry.schema.json).
CiteWire validates the same contract at runtime, rejects unknown fields and
nested secret-like fields, and fails closed when a source or rights rule is
missing. The bundled entries are a small seed based on providers already
documented in this repository. Their review records must be reassessed on the
declared cadence; registry presence is not a permanent legal or technical
approval.

## Rights evaluation

`evaluate_rights` separates access from reuse:

1. public, personal-credential, and organization-credential access;
2. personal research, internal organization use, public briefs, and
   republication;
3. metadata, excerpt, summary, and republication operations; and
4. the source-specific combinations explicitly present in the registry.

Unknown or unsupported combinations return `hold`. Credential-based access
requires an opaque reference using an approved secret-manager or environment
reference scheme. CiteWire evaluates that reference in memory and returns only
whether a valid reference was present; it never returns or logs the reference
value. Credentials do not bypass access controls or grant redistribution
rights.

## Shadow classifier

The deterministic inclusion classifier is an observable baseline, not an
automated publisher. Its score bands are configurable, with defaults at `.50`
and `.60`, but its mode is forced to `shadow` and `publishable` is always
`false`. Missing rights, attribution, publication time, canonical URL, or
feature evidence causes abstention and a held result.

The current weights are not calibrated against a representative labeled
corpus. Any active editorial workflow, provider connection, visible label, or
automated publication remains a separate reviewed phase.

## Public MCP surface

With `community.enabled: true`, CiteWire exposes read-only, local tools using
the canonical names `search_articles`, `get_article`, `list_topics`,
`list_sources`, `evaluate_rights`, `explain_inclusion`, and `get_health`.
During this policy-only phase, article and topic catalogs are deliberately
empty. The source, policy, and health resources perform no external calls.

Existing `news.*` and provider tools remain unchanged. The Community policy
surface is additive and disabled unless explicitly configured.
