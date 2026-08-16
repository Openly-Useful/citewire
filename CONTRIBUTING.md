# Contributing to citewire

Thanks for helping improve citewire. The project stays small on purpose, but it
welcomes focused fixes, provider adapters, tests, documentation, and
compatibility improvements.

Before starting a large change, read [Governance](docs/governance.md) and open
an issue. Maintainers use that discussion to confirm scope before either side
invests in implementation.

## Project commitments

Contributions must preserve these boundaries:

- Community remains genuinely useful and MIT licensed.
- Every maintained public provider adapter in this repository remains available
  in Community.
- Commercial value belongs in hosted operations, personalization, workflows,
  collaboration, retained history, and support. Do not cripple Community to
  create a paid upgrade path.
- Provider tools are disabled by default and enabled deliberately by the
  deployer.
- citewire returns source metadata and links. It does not store or republish
  article bodies.
- The core remains read-only, stateless, and self-hostable.
- The project keeps zero runtime dependencies unless a major proposal is
  approved.

See [Product tiers](docs/product-tiers.md) for the complete product boundary.

## Requirements

- Node.js 18 or newer.
- Git for a normal contribution workflow.
- No install step. The repository has no runtime or development dependencies.

## Run the tests

```sh
npm test
```

The suite uses Node's built-in test runner against files in `test/`. Tests must
not depend on live provider access. Use an injected fake `fetch` and deterministic
responses so CI does not depend on upstream availability.

Run the full suite before opening a pull request. Add or update tests for every
behavior change.

## Choose the right contribution path

### Small fixes

Documentation corrections, focused bug fixes, test coverage, and compatible
schema clarifications can usually go straight to a pull request.

### Major changes

Open an issue first for any change that would:

- Break a public export, config field, tool name, schema, or transport.
- Change the compatible-platform contract.
- Add storage, accounts, telemetry, or write operations.
- Add a runtime dependency.
- Remove or materially narrow a provider.
- Change licensing, governance, or the Community product boundary.

Include the user problem, proposed design, alternatives, migration impact,
security and privacy effects, and test strategy. See the major-change process
in [Governance](docs/governance.md#major-changes).

## Adding a provider

Provider contributions are welcome when the upstream service has a documented
read API and a clear news, research, or attribution use case.

Each provider must:

- Export a stable `key` used in configuration.
- Export a human-readable `title`.
- Export a `docsUrl` that points to the provider's own API documentation.
- Export an honest `termsNote` based on current provider documentation.
- State the free-access basis, authentication requirements, and known courtesy
  limits without treating reachability as permission.
- Default to disabled.
- Return metadata and source links without storing or republishing content.
- Preserve source attribution and identifiers supplied by the upstream API.
- Use the shared provider utilities where appropriate.
- Apply a reasonable timeout and return readable tool errors.
- Avoid bypassing authentication, paywalls, access controls, rate controls, or
  other technical restrictions.
- Add deterministic tests with an injected fake `fetch`.
- Add an entry to `docs/providers.md` in the same pull request.

Do not use an unofficial endpoint when a documented official read API is
available. Do not copy upstream documentation or terms wholesale. Summarize the
relevant behavior and link to the source.

### Provider pull request checklist

- [ ] Provider key and tool namespace are short, clear, and collision-free.
- [ ] Every tool has a focused description and JSON input schema.
- [ ] Query parameters are encoded safely.
- [ ] Successful responses return structured metadata and source links.
- [ ] Upstream and parsing failures return readable tool errors.
- [ ] No provider call occurs unless the provider is explicitly enabled.
- [ ] No API key, credential, personal data, or live response fixture is
  committed.
- [ ] Tests cover enablement, tool discovery, a successful response, and a
  representative failure.
- [ ] `docs/providers.md` links to the upstream provider documentation.
- [ ] `npm test` passes.

## Platform and transport changes

The `news.*` tools are a projection of the contract in
[docs/platform-contract.md](docs/platform-contract.md). A change to the tool
surface and a change to that document must travel together.

Transport changes must preserve protocol output discipline:

- stdout contains protocol frames only for stdio.
- Diagnostics go to stderr.
- HTTP responses retain appropriate content type and no-store behavior.
- Notifications produce no JSON-RPC response body.
- Tests cover error and success paths without opening external network
  connections.

## The zero-dependency rule

citewire has no runtime or development dependencies. A proposal to add one must
explain:

1. The specific behavior the dependency provides.
2. Why Node built-ins and a small local helper are insufficient.
3. The dependency's license, maintenance, security, and package-size impact.
4. How the project would remove or replace it later.

Open an issue before submitting that change. Most dependency proposals will not
fit the project.

## Documentation standards

Documentation should describe behavior that exists in the referenced version.

- Use commands that can be copied and run.
- Distinguish current behavior from product direction.
- Link to primary provider, protocol, registry, or catalog documentation.
- Do not fabricate or estimate usage metrics, availability, pricing, support
  commitments, customer adoption, or listing status.
- Mark an unperformed registry or catalog action `PENDING` in
  [docs/distribution.md](docs/distribution.md).
- Do not call a submitted listing complete until the public record is visible
  and verified.
- Keep attribution concise and preserve links to original sources.

## Pull request process

1. Create a focused branch in your fork.
2. Make one coherent change.
3. Add tests for changed behavior.
4. Update the relevant documentation.
5. Run `npm test`.
6. Open a pull request that explains the problem, solution, compatibility
   impact, and verification performed.

Keep unrelated cleanup out of the same pull request. Maintainers may ask for a
change to be split when independent concerns would be easier to review and
revert separately.

### Pull request checklist

- [ ] The change is within citewire's read-only, attribution-first scope.
- [ ] Existing Community provider capabilities remain intact.
- [ ] Public contract changes are documented.
- [ ] Tests are deterministic and pass locally.
- [ ] No runtime dependency was added without prior approval.
- [ ] No secret, credential, source content, or personal data was committed.
- [ ] New third-party material is license-compatible and attributed where
  required.
- [ ] Registry and catalog status is factual and evidence-backed.
- [ ] The pull request can be reviewed and reverted as one coherent unit.

## Commit and review expectations

Use concise commit messages that explain the change. During review, address the
technical point directly and update tests or documentation when behavior
changes. Maintainers may close a proposal that conflicts with project scope,
provider terms, security, the zero-dependency rule, or the Community guarantee.

## Security reports

Do not open a public issue containing exploit details for an unpatched
vulnerability.

Follow [SECURITY.md](SECURITY.md) for the current private reporting channel and
the information to include. Remove secrets, tokens, personal data, and
third-party content from the report.

## License

By submitting a contribution for inclusion in this repository, you agree that
it may be distributed under the repository's [MIT license](LICENSE). Submit
only work that you have the right to contribute.

## Conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). Be
professional, focus discussion on technical and user impact, and make space for
evidence that changes the proposed approach.
