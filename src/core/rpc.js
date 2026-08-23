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

function publicResource(resource) {
  const descriptor = {
    uri: resource.uri,
    name: resource.name,
  };
  if (resource.title) descriptor.title = resource.title;
  if (resource.description) descriptor.description = resource.description;
  if (resource.mimeType) descriptor.mimeType = resource.mimeType;
  return descriptor;
}

function publicResourceTemplate(template) {
  const descriptor = {
    uriTemplate: template.uriTemplate,
    name: template.name,
  };
  if (template.title) descriptor.title = template.title;
  if (template.description) descriptor.description = template.description;
  if (template.mimeType) descriptor.mimeType = template.mimeType;
  return descriptor;
}

export function createServer({ serverInfo, instructions, tools, resources, resourceTemplates }) {
  const toolList = tools || [];
  const byName = new Map(toolList.map((t) => [t.name, t]));
  const resourceList = resources || [];
  const resourcesByUri = new Map(resourceList.map((resource) => [resource.uri, resource]));
  const templateList = resourceTemplates || [];

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
        capabilities: {
          tools: { listChanged: false },
          ...(resourceList.length || templateList.length ? { resources: { listChanged: false } } : {}),
        },
        serverInfo,
        instructions,
      });
    }
    if (method === 'ping') return rpcResult(id, {});
    if (method === 'tools/list') {
      return rpcResult(id, { tools: toolList.map(publicTool) });
    }
    if (method === 'resources/list') {
      return rpcResult(id, { resources: resourceList.map(publicResource) });
    }
    if (method === 'resources/templates/list') {
      return rpcResult(id, { resourceTemplates: templateList.map(publicResourceTemplate) });
    }
    if (method === 'resources/read') {
      const uri = params && params.uri;
      if (typeof uri !== 'string') return rpcError(id, -32602, 'Resource URI must be a string.');
      const exact = resourcesByUri.get(uri);
      try {
        const template = exact ? null : templateList.find((candidate) => candidate.match(uri));
        if (!exact && !template) return rpcError(id, -32602, 'Resource not found.');
        const content = exact ? await exact.read() : await template.read(uri);
        if (!content) return rpcError(id, -32602, 'Resource not found.');
        return rpcResult(id, { contents: [content] });
      } catch {
        return rpcError(id, -32603, 'Resource read failed.');
      }
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

  return { handle, tools: toolList, resources: resourceList, resourceTemplates: templateList };
}
