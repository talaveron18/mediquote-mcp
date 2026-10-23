import type { Config, Context } from '@netlify/functions';

export default async function health(_request: Request, _context: Context): Promise<Response> {
  return new Response(JSON.stringify({ ok: true, service: 'mediquote-mcp', version: '0.2.0' }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export const config: Config = { path: '/health' };
