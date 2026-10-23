import { timingSafeEqual } from 'node:crypto';
import { getEnv } from './env.js';

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isAuthorized(request: Request): boolean {
  const expected = getEnv('MCP_ACCESS_TOKEN')?.trim();
  if (!expected) return false;
  const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i);
  return Boolean(match?.[1] && safeEqual(match[1], expected));
}

export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
