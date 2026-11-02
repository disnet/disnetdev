// MCP server (Streamable HTTP transport, stateless, JSON responses only) for
// drafting posts into the studio. See $lib/server/mcp-tools for the tools and
// $lib/server/mcp-oauth for how a client gets a token.

import { AUTHOR_DID, SITE_NAME } from '$lib/config';
import { CORS_HEADERS, getResourceMetadataUrl, verifyAccessToken } from '$lib/server/mcp-oauth';
import { ToolError, getTool, tools } from '$lib/server/mcp-tools';
import type { RequestHandler } from './$types';

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const INSTRUCTIONS = `Drafts for Tim's blog (disnetdev.com), stored on his PDS and shown in his studio at /admin.
Write in Tim's voice: first person, plain, specific; no filler intros or listicle headings. Don't invent opinions or experiences he hasn't stated; mark gaps with <!-- TODO: ... -->.
Nothing here publishes. Hand Tim the studioUrl and he publishes from the studio.
Before revising a draft, get_draft it again: he may have edited it.
If you wrote most of the prose (not just edited his), add the tag "vibeslop" so the post is labeled as AI-generated.`;

type JsonRpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS, ...(init.headers ?? {}) }
  });
}

function unauthorized(description: string) {
  return json(
    { error: 'invalid_token', error_description: description },
    {
      status: 401,
      headers: {
        'www-authenticate': `Bearer resource_metadata="${getResourceMetadataUrl()}", error="invalid_token", error_description="${description}"`
      }
    }
  );
}

async function handle(message: JsonRpcRequest, did: string) {
  const { id, method, params = {} } = message;
  // Notifications (no id) get no response.
  if (id === undefined || id === null) return null;

  const result = (value: unknown) => ({ jsonrpc: '2.0', id, result: value });
  const failure = (code: number, text: string) => ({ jsonrpc: '2.0', id, error: { code, message: text } });

  switch (method) {
    case 'initialize': {
      const requested = String(params.protocolVersion ?? '');
      return result({
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: `${SITE_NAME}-drafts`, title: `${SITE_NAME} drafts`, version: '1.0.0' },
        instructions: INSTRUCTIONS
      });
    }
    case 'ping':
      return result({});
    case 'tools/list':
      return result({
        tools: tools.map(({ name, title, description, inputSchema, annotations }) => ({
          name,
          title,
          description,
          inputSchema,
          ...(annotations ? { annotations } : {})
        }))
      });
    case 'tools/call': {
      const tool = getTool(String(params.name ?? ''));
      if (!tool) return failure(-32602, `Unknown tool: ${String(params.name)}`);
      try {
        const value = await tool.run((params.arguments as Record<string, unknown>) ?? {}, did);
        return result({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
      } catch (err) {
        if (!(err instanceof ToolError)) console.error(`[mcp] ${tool.name} failed`, err);
        const text =
          err instanceof ToolError
            ? err.message
            : `${tool.name} failed: ${err instanceof Error ? err.message : String(err)}. If this is an auth error, Tim needs to sign in to the studio again.`;
        return result({ content: [{ type: 'text', text }], isError: true });
      }
    }
    default:
      return failure(-32601, `Method not found: ${method}`);
  }
}

export const POST: RequestHandler = async ({ request }) => {
  const grant = await verifyAccessToken(request.headers.get('authorization'));
  if (!grant) return unauthorized('Missing or expired access token');
  if (!AUTHOR_DID || grant.did !== AUTHOR_DID) return unauthorized('Token is not for the site author');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400 });
  }

  // Batches are only for older clients (2025-06-18 dropped them). Run them in
  // order so two writes to the same draft can't race.
  const messages = (Array.isArray(body) ? body : [body]) as JsonRpcRequest[];
  const responses = [];
  for (const message of messages) {
    const response = await handle(message, grant.did);
    if (response) responses.push(response);
  }
  if (responses.length === 0) return new Response(null, { status: 202, headers: CORS_HEADERS });
  return json(Array.isArray(body) ? responses : responses[0]);
};

// No server-initiated stream and no sessions to end.
export const GET: RequestHandler = () =>
  new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST', ...CORS_HEADERS } });
export const DELETE: RequestHandler = GET;
export const OPTIONS: RequestHandler = () => new Response(null, { status: 204, headers: CORS_HEADERS });
