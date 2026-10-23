import { afterEach, describe, expect, it } from 'vitest';
import { isAuthorized } from '../src/auth.js';

const original = process.env.MCP_ACCESS_TOKEN;
afterEach(() => {
  if (original === undefined) delete process.env.MCP_ACCESS_TOKEN;
  else process.env.MCP_ACCESS_TOKEN = original;
});

describe('MCP bearer auth', () => {
  it('acepta el bearer correcto y rechaza el resto', () => {
    process.env.MCP_ACCESS_TOKEN = 'test-secret';
    expect(isAuthorized(new Request('https://example.test/mcp', { headers: { authorization: 'Bearer test-secret' } }))).toBe(true);
    expect(isAuthorized(new Request('https://example.test/mcp', { headers: { authorization: 'Bearer wrong' } }))).toBe(false);
    expect(isAuthorized(new Request('https://example.test/mcp'))).toBe(false);
  });

  it('falla cerrado sin secreto configurado', () => {
    delete process.env.MCP_ACCESS_TOKEN;
    expect(isAuthorized(new Request('https://example.test/mcp', { headers: { authorization: 'Bearer anything' } }))).toBe(false);
  });
});
