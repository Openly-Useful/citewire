# Releasing citewire

Releases are deliberate and manual. A tag alone never publishes anything.
Publishing requires a manual workflow dispatch, an exact version tag, and the
`release` GitHub Environment.

## Release invariants

- `package.json` version, `server.json` version, and the npm package version
  must be identical.
- `package.json` `mcpName` must exactly match `server.json` `name`.
- `server.json` package identifier must exactly match the npm package name.
- The release remains MIT licensed and has no runtime or development
  dependencies.
- A publishing run must use the `v<version>` tag and that tag must point to a
  commit on `main`.
- npm artifacts must include provenance.
- npm is published before the same version is submitted to the MCP Registry.

## One-time owner setup

Complete these steps before enabling either publish input.

1. Create a GitHub Environment named `release`. Add a required reviewer and
   restrict deployment tags to `v*`. An environment with no protection rules
   does not provide an approval gate.
2. In the npm settings for `citewire`, configure a GitHub Actions trusted
   publisher with these exact values:
   - Owner: `Openly-Useful`
   - Repository: `citewire`
   - Workflow filename: `release.yml`
   - Environment: `release`
   - Allowed action: npm publish
3. Do not add an `NPM_TOKEN`. The workflow uses npm trusted publishing through
   GitHub OIDC. After the first successful trusted publish, disallow token-based
   package publishing in npm and revoke obsolete write tokens.
4. Confirm the GitHub account running the workflow can publish the
   `io.github.Openly-Useful/*` namespace to the official MCP Registry. MCP Registry
   authentication also uses GitHub OIDC and needs no stored secret.
5. Enable GitHub private vulnerability reporting for the repository. Until it
   is enabled, security reports use the contact in `SECURITY.md`.
6. Protect release tags and require review on `main` according to the
   repository's normal maintenance policy.

## Important 0.1.0 state

`citewire@0.1.0` is already on npm. Its published package does not contain the
`mcpName` ownership marker. npm versions are immutable, so 0.1.0 cannot be
republished and cannot pass official MCP Registry package validation.

The repository also has no `v0.1.0` tag. Do not tag current `main` as 0.1.0.
If the owner creates a retrospective tag, it must point to the npm artifact's
recorded source commit, `d4d3b77992930486205cb6b8c43e0a771472f2be`, and must
not be used for publication.

The coordinated release candidate is 0.2.0. It remains unpublished and untagged
until the reviewed release commit is merged to `main`. Do not submit
`server.json` version 0.1.0 to the MCP Registry, and do not publish 0.2.0 before
the owner setup and release gates below are complete.

## Prepare a release

1. Choose an unpublished semantic version.
2. Update the version in `package.json` and both version fields in `server.json`.
3. Coordinate the same runtime version change in `src/index.js` and
   `src/config.js`. Those files are outside the release-metadata ownership
   boundary, so their owner must approve and make that change.
4. Move the relevant entries from `Unreleased` into a dated version section in
   `CHANGELOG.md`.
5. Run the local checks:

   ```sh
   npm test
   npm run release:check
   npm pack --dry-run --json
   ```

6. Review the package file list. It must contain `server.json`, source, the CLI,
   license, changelog, README, and security policy. It must not contain secrets,
   local configuration, fixtures with private data, or dependencies.
7. Merge the reviewed release commit to `main`.
8. Tag that exact commit and push the tag:

   ```sh
   git tag -s vX.Y.Z -m "citewire vX.Y.Z"
   git push origin vX.Y.Z
   ```

Use an annotated tag instead if signed tags are not configured. Do not move or
reuse a published version tag.

## Run the manual workflow

1. Open **Actions > Release > Run workflow**.
2. Select the `vX.Y.Z` tag as the workflow ref.
3. Enter `X.Y.Z` without the leading `v`.
4. Leave both publish inputs off for a preflight run.
5. After the preflight succeeds and the `release` Environment approval is
   ready, run again from the same tag with both publish inputs enabled.
6. Approve the Environment deployment after confirming the tag, changelog,
   package contents, and version.

The workflow refuses an existing npm version. It publishes npm first, confirms
that the public package contains the expected `mcpName`, validates `server.json`
with the official publisher, then publishes to the MCP Registry.

If npm succeeds but MCP Registry publication fails, do not change or recreate
the tag. Fix only non-versioned owner configuration when possible, then rerun
the same tag with npm publishing off and MCP Registry publishing on. If code or
metadata must change, prepare a new patch version.

## Verify and announce

Verify the immutable artifact and registry entry:

```sh
npm view citewire@X.Y.Z version mcpName dist.integrity
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.Openly-Useful%2Fcitewire&version=latest"
```

Confirm npm shows provenance linked to this public repository. Confirm the MCP
Registry entry has the expected name, version, repository, npm package, and
stdio transport. Then create the GitHub Release from the existing tag using the
matching changelog section.

## Recovery and rollback

npm packages are immutable. Do not try to overwrite a bad artifact. Deprecate
the affected npm version with a concise reason, prepare a fixed patch release,
and publish it through the same workflow.

If registry metadata is unsafe or unusable, use the official
`mcp-publisher status` command to deprecate the affected server version, then
publish a fixed patch. Record the action in the changelog and security advisory
when relevant.

The workflow pins `mcp-publisher` and verifies its SHA-256 digest. Update the
version and digest together after reviewing an official MCP Registry release.
