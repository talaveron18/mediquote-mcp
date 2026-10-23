import type { Config, Context } from '@netlify/functions';
import { bearerToken, unauthorized } from '../../src/auth.js';
import { MediQuoteApiError, resolveIdentity } from '../../src/mediquote-client.js';
import { toolManifest } from '../../src/tools.js';

export default async function bridgeTools(request: Request, _context: Context): Promise<Response> {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const token = bearerToken(request);
  if (!token) return unauthorized();
  try {
    const identity = await resolveIdentity(token);
    return new Response(JSON.stringify({
      user: identity.user,
      connection: identity.connection,
      tools: toolManifest(identity.capabilities),
    }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  } catch (error) {
    if (error instanceof MediQuoteApiError && (error.status === 401 || error.status === 403)) return unauthorized();
    return Response.json({ error: 'No se pudo validar la conexión' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}

export const config: Config = { path: '/bridge/tools' };
