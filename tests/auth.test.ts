import { describe, expect, it } from 'vitest';
import { bearerToken } from '../src/auth.js';

describe('MCP personal bearer auth', () => {
  it('acepta únicamente llaves personales mqai suficientemente largas', () => {
    const valid = 'mqai_abcdefghijklmnopqrstuvwxyz1234567890';
    expect(bearerToken(new Request('https://example.test/mcp', { headers: { authorization: `Bearer ${valid}` } }))).toBe(valid);
    expect(bearerToken(new Request('https://example.test/mcp', { headers: { authorization: 'Bearer wrong' } }))).toBeNull();
    expect(bearerToken(new Request('https://example.test/mcp', { headers: { authorization: 'Bearer mqai_short' } }))).toBeNull();
    expect(bearerToken(new Request('https://example.test/mcp'))).toBeNull();
  });

  it('tolera mayúsculas en el esquema Bearer pero no altera el secreto', () => {
    const valid = 'mqai_abcdefghijklmnopqrstuvwxyz1234567890';
    expect(bearerToken(new Request('https://example.test/mcp', { headers: { authorization: `bEaReR ${valid}` } }))).toBe(valid);
  });
});
