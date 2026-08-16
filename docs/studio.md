# CiteWire Studio

Studio is an optional exception-first control surface. It is separate from the
root CiteWire server and does not change Community package startup, exports, or
distribution.

## Trust boundary

An integrating server supplies this trusted principal after authentication and
membership checks:

```js
{
  subjectId: 'user-123',
  account: { type: 'personal', id: 'account-456' },
  accountRoles: ['viewer'],
  systemRoles: []
}
```

Request bodies, paths, and browser state are never authorities for account
scope. A deployment that supports account switching must establish the new
scope server-side before it calls Studio.

## Reference API

- `GET /v1/studio/health` reports local-only posture.
- `GET /v1/studio/session` reports scope and capabilities.
- `GET /v1/studio/overview` reports account-scoped counts.
- `GET /v1/studio/sources` reads the reviewed registry with disabled settings.
- `GET /v1/studio/connectors` returns redacted disabled configurations.
- `PUT /v1/studio/connectors/{id}` configures, but cannot activate, a connector.
- `GET /v1/studio/exceptions` lists the account exception queue.
- `PUT /v1/studio/exceptions/{id}` supports acknowledge, hold, or dismiss.
- `GET /v1/studio/assessments` returns non-running cadence definitions.
- `GET /v1/studio/audit` returns account-scoped redacted events.
- `PUT /v1/studio/control/global-pause` is system-operator-only.

Mutations require an idempotency key. A replay with identical input returns the
original result; reuse with different input is a conflict.

## Production boundary

The memory store is not production persistence. It cannot coordinate multiple
processes, survive restarts, create tamper evidence, or enforce durable global
pause. The static interface assumes a deployment-owned same-origin HttpOnly
session and CSRF protection. CiteWire does not select or configure those
systems in this phase.
