# Credential references and connectors

A connector definition records an account-scoped intention to use an existing,
reviewed CiteWire source adapter. Configuration does not activate the adapter.
Every connector is stored with `activation_state: disabled` and
`external_calls: false`.

## Credential references

Credentialed access modes accept an opaque reference such as:

```text
env://CITEWIRE_OPENALEX_REFERENCE
vault://citewire/openalex/account-a
aws-sm://us-east-1/citewire/openalex
gcp-sm://citewire/openalex
azure-kv://citewire/openalex
```

The reference identifies a deployment-owned secret-manager location. CiteWire
Studio does not resolve it. API responses and audit events show only the scheme
and a redacted marker. Raw passwords, authorization headers, cookies, private
keys, API values, and nested secret-like fields are rejected.

Credentialed access never changes reuse rights. Rights evaluation remains a
separate fail-closed decision, and successful access does not grant permission
to republish.

## Endpoint policy

The current reviewed source registry does not declare `allowed_origins`.
Therefore this phase accepts only endpointless connector definitions using a
registry `source_id` and its reviewed `adapter`.

The shared endpoint validator is available for a future registry revision. It
requires an exact reviewed HTTPS origin and rejects URL credentials, query
parameters, fragments, non-default ports, IP literals, local names,
internationalized names, path traversal, and suffix or wildcard matching.

Static URL checks do not prevent DNS rebinding. A future executor must vet all
resolved addresses, revalidate every redirect, enforce network-level egress
policy, and bind the validated destination through connection setup. No such
executor or network call is part of this phase.
