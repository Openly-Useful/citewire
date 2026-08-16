# Shadow classifier calibration

`src/community/calibration.js` compares the deterministic inclusion classifier
with a versioned, reviewed fixture corpus. It produces evidence only.

Possible evidence states are `missing`, `stale`, `failed`, and `passed`.
Model-version or threshold mismatches are stale. A passed report still returns
`activation_effect: none`; it cannot change configuration, item state, a feed,
or an MCP response.

The corpus schema stores normalized classifier inputs and expected tiers. It
must not contain article bodies, credentials, personal data, or provider
tokens. Corpus changes require a new revision and review timestamp.

Thresholds remain configurable in shadow mode with the default boundaries:

- Below `.50`: held
- `.50` through `.5999`: adjacent tier
- `.60` and above: standard tier

This foundation emits tier identifiers and reason codes only. Visible label
copy is intentionally outside its scope and remains owner-reviewed product
work.
