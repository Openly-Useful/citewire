// Example: mount citewire as a Vercel (or any Node serverless) function.
//
// Drop this at `api/mcp.js` in a Vercel project. The MCP endpoint is then
// POST /api/mcp. The server is built once at module scope and reused across
// invocations; createHttpHandler reads the pre-parsed req.body Vercel provides.
//
//   package.json needs: { "type": "module", "dependencies": { "citewire": "^0.2.0" } }

import { createCitewire } from 'citewire';
import { createHttpHandler } from 'citewire/transports/http';

// Inline config. In a real deployment you might read parts of this from
// process.env (e.g. siteUrl) instead of hardcoding.
const server = createCitewire({
  platform: {
    name: 'Karaya Group Industry News',
    siteUrl: 'https://karaya.group',
    apiBase: 'https://karaya.group/api/v1/news',
  },
});

// createHttpHandler returns an async (req, res) handler: POST-only JSON-RPC,
// 202 for accepted notifications, 200 application/json otherwise.
const handler = createHttpHandler(server);

export default handler;
