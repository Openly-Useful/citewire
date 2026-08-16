# CiteWire examples

Working examples for running citewire and wiring it into MCP clients.

## Files

- `karaya.config.json` — a minimal config pointing at the Karaya Group Industry
  News platform (the first production deployment).
- `vercel-function.js` — mounting citewire as a serverless function.

## About the config

`karaya.config.json` sets only the `platform` block: the display name, the site
URL, and the API base the tools read from. There is no `providers` block. JSON
has no comments, so note it here: with providers absent, citewire runs with its
built-in defaults and does not enable any optional provider integration. Add a
`providers` object to the config to turn those on.

## Run locally over stdio

stdio is the default transport. This is how MCP clients launch the server.

```
npx citewire --config examples/karaya.config.json
```

The process reads newline-delimited JSON-RPC on stdin and writes responses on
stdout; diagnostics go to stderr.

## Wire into Claude Desktop or Claude Code

Add citewire to your MCP client config (Claude Desktop:
`claude_desktop_config.json`; Claude Code: `.mcp.json` or `claude mcp add`):

```json
{
  "mcpServers": {
    "citewire": {
      "command": "npx",
      "args": ["citewire", "--config", "examples/karaya.config.json"]
    }
  }
}
```

Use an absolute path for `--config` if the client does not launch from your
project directory.

## Run the HTTP server

To serve over HTTP instead of stdio:

```
npx citewire --config examples/karaya.config.json --http 8722
```

The default port is 8722. The endpoint accepts JSON-RPC over `POST /`.

## Deploy the Vercel example

Copy `vercel-function.js` to `api/mcp.js` in a Vercel project that has
`citewire` as a dependency and `"type": "module"` in its `package.json`. After
deploying, the MCP endpoint is `POST /api/mcp`.
