// src/core/rpc.js — the transport-agnostic MCP core.
//
// Hand-written, stateless MCP: JSON-RPC 2.0 request/response with no SDK, no
// sessions, no SSE. `createServer` takes server identity plus a flat list of
// tools and returns a `handle(message)` that any transport (stdio, HTTP, a
// test harness) can feed one parsed JSON-RPC message at a time. The core knows
// nothing about how messages arrive or where results go, so the same protocol
// logic serves every transport and cannot drift between them.
//
// A tool is { name, description, inputSchema, handler: async (args) => result }.
// Only the first three are ever put on the wire; the handler stays server-side.

const PROTOCOL_VERSION = '2025-06-18';

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

// A tool result reporting a failure the caller can read and recover from,
// never a protocol error. Used for handler exceptions and by tool authors.
export function toolError(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

// A successful tool result. structuredContent carries the machine-readable
// payload; content carries the same thing as text for clients that only read
// text blocks.
export function toolJson(payload) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload) }],
    structuredContent: payload,
    isError: false,
  };
}

// Serialize a tool for tools/list: the wire shape only, never the handler.
function publicTool(tool) {
  const descriptor = {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  };
  if (tool.title) descriptor.title = tool.title;
  if (tool.outputSchema) descriptor.outputSchema = tool.outputSchema;
  if (tool.annotations) descriptor.annotations = tool.annotations;
  return descriptor;
}

export function createServer({ serverInfo, instructions, tools }) {
  const toolList = tools || [];
  const byName = new Map(toolList.map((t) => [t.name, t]));

  async function callTool(name, args) {
    const tool = byName.get(name);
    if (!tool) return null; // unknown tool -> protocol error at the dispatch site
    try {
      return await tool.handler(args || {});
    } catch (err) {
      // A throwing handler must never crash the transport; surface it as a
      // tool-level error the agent caller can read.
      const message = err && err.message ? err.message : String(err);
      return toolError(`tool_error: ${message}`);
    }
  }

  async function handle(message) {
    if (Array.isArray(message)) {
      return rpcError(null, -32600, 'Batch requests are not supported.');
    }
    if (
      !message ||
      typeof message !== 'object' ||
      message.jsonrpc !== '2.0' ||
      typeof message.method !== 'string'
    ) {
      return rpcError(message && message.id, -32600, 'Not a JSON-RPC 2.0 request.');
    }

    const { id, method, params } = message;
    const isNotification = id === undefined;

    if (method.startsWith('notifications/')) return undefined; // acknowledged, no body

    if (method === 'initialize') {
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo,
        instructions,
      });
    }
    if (method === 'ping') return rpcResult(id, {});
    if (method === 'tools/list') {
      return rpcResult(id, { tools: toolList.map(publicTool) });
    }
    if (method === 'tools/call') {
      const name = params && params.name;
      const result = await callTool(name, params && params.arguments);
      if (result === null) return rpcError(id, -32602, `Unknown tool: ${String(name)}`);
      return rpcResult(id, result);
    }

    if (isNotification) return undefined; // unknown notification, acknowledged
    return rpcError(id, -32601, `Method not found: ${method}`);
  }

  return { handle, tools: toolList };
}
