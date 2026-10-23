import type { Config, Context } from '@netlify/functions';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { buildServer } from '../../src/server.js';
import { isAuthorized, unauthorized } from '../../src/auth.js';

const handler = createMcpHandler(() => buildServer());

export default async function mcp(request: Request, _context: Context): Promise<Response> {
  if (!isAuthorized(request)) return unauthorized();
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  return handler.fetch(request);
}

export const config: Config = {
  path: '/mcp',
  rateLimit: { windowSize: 60, windowLimit: 120, aggregateBy: ['ip', 'domain'] },
};
