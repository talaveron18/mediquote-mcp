import type { Config, Context } from '@netlify/functions';
import { isAuthorized, unauthorized } from '../../src/auth.js';
import { toolManifest } from '../../src/tools.js';

export default async function bridgeTools(request: Request, _context: Context): Promise<Response> {
  if (!isAuthorized(request)) return unauthorized();
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  return new Response(JSON.stringify({ tools: toolManifest() }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export const config: Config = { path: '/bridge/tools' };
