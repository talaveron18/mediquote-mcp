import type { Config, Context } from '@netlify/functions';
import { isAuthorized, unauthorized } from '../../src/auth.js';
import { toolByName } from '../../src/tools.js';

export default async function bridgeCall(request: Request, _context: Context): Promise<Response> {
  if (!isAuthorized(request)) return unauthorized();
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'JSON inválido' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ error: 'Body inválido' }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  if (typeof record.name !== 'string') {
    return Response.json({ error: 'name es obligatorio' }, { status: 400 });
  }
  const tool = toolByName(record.name);
  if (!tool) return Response.json({ error: 'Herramienta no encontrada' }, { status: 404 });

  try {
    const result = await tool.execute(record.arguments ?? {});
    return Response.json({ ok: true, result }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return Response.json({ ok: false, error: message }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }
}

export const config: Config = {
  path: '/bridge/call',
  rateLimit: { windowSize: 60, windowLimit: 120, aggregateBy: ['ip', 'domain'] },
};
