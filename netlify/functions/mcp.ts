import type { Config, Context } from '@netlify/functions';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { buildServer } from '../../src/server.js';
import { bearerToken, unauthorized } from '../../src/auth.js';
import { MediQuoteApiError, resolveIdentity } from '../../src/mediquote-client.js';

export default async function mcp(request: Request, _context: Context): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const token = bearerToken(request);
  if (!token) return unauthorized();

  try {
    const identity = await resolveIdentity(token);
    const handler = createMcpHandler(() => buildServer(token, identity));
    return handler.fetch(request);
  } catch (error) {
    if (error instanceof MediQuoteApiError && (error.status === 401 || error.status === 403)) {
      return unauthorized('Conexión personal de MediQuote no válida o sin permisos');
    }
    console.error(JSON.stringify({ event: 'mcp_auth_error', error: error instanceof Error ? error.message : 'unknown' }));
    return Response.json({ error: 'MediQuote no está disponible para validar la conexión' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}

export const config: Config = {
  path: '/mcp',
  rateLimit: { windowSize: 60, windowLimit: 120, aggregateBy: ['ip', 'domain'] },
};
