import type { Config, Context } from '@netlify/functions';
import { bearerToken, unauthorized } from '../../src/auth.js';
import { MediQuoteApiError, resolveIdentity } from '../../src/mediquote-client.js';
import { toolByName } from '../../src/tools.js';

export default async function bridgeCall(request: Request, _context: Context): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const token = bearerToken(request);
  if (!token) return unauthorized();

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'JSON inválido' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return Response.json({ error: 'Body inválido' }, { status: 400 });

  const record = body as Record<string, unknown>;
  if (typeof record.name !== 'string') return Response.json({ error: 'name es obligatorio' }, { status: 400 });

  try {
    const identity = await resolveIdentity(token);
    const tool = toolByName(record.name, identity.capabilities);
    if (!tool) return Response.json({ error: 'Herramienta no disponible para este usuario' }, { status: 404, headers: { 'cache-control': 'no-store' } });
    const result = await tool.execute(token, record.arguments ?? {});
    console.info(JSON.stringify({ event: 'bridge_call', userId: identity.user.id, role: identity.user.role, connectionId: identity.connection.id, tool: tool.name, ok: true }));
    return Response.json({ ok: true, result }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    if (error instanceof MediQuoteApiError && (error.status === 401 || error.status === 403)) return unauthorized();
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return Response.json({ ok: false, error: message }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }
}

export const config: Config = {
  path: '/bridge/call',
  rateLimit: { windowSize: 60, windowLimit: 120, aggregateBy: ['ip', 'domain'] },
};
