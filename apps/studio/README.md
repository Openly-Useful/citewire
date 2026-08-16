# CiteWire Studio

Studio is an optional, dependency-free reference control surface. It is not
imported by the CiteWire package, included in the package tarball, started by a
transport, or deployed by this repository.

The API trusts only a deployment-injected principal. Personal and organization
accounts are separate storage scopes. The included memory adapter is for tests
and local evaluation; it is not durable production storage.

Connectors store opaque credential references, never credential values. They
remain disabled and endpointless because the current reviewed source registry
does not define outbound origins. Studio makes no provider calls and exposes no
publication action. Assessment definitions are informational and do not run a
scheduler.

An integrating deployment must provide authenticated same-origin sessions,
CSRF protection, durable account-scoped persistence, and network egress policy
before considering production use.
