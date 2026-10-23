import { afterEach, describe, expect, it, vi } from 'vitest';
import { mediquoteRequest, resolveIdentity } from '../src/mediquote-client.js';

const originalUrl = process.env.MEDIQUOTE_API_URL;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalUrl === undefined) delete process.env.MEDIQUOTE_API_URL; else process.env.MEDIQUOTE_API_URL = originalUrl;
});

describe('MediQuote REST client', () => {
  it('reenvía la llave personal como bearer, aplica query y devuelve JSON', async () => {
    process.env.MEDIQUOTE_API_URL = 'https://mediquote.test/api/v1/';
    const token = 'mqai_personal-secret';
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://mediquote.test/api/v1/clientes?search=acme');
      expect(new Headers(init?.headers).get('authorization')).toBe(`Bearer ${token}`);
      return new Response(JSON.stringify([{ cif: 'B123' }]), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(mediquoteRequest(token, 'clientes', {}, { search: 'acme' })).resolves.toEqual([{ cif: 'B123' }]);
  });

  it('resuelve identidad y capacidades a través de /me', async () => {
    process.env.MEDIQUOTE_API_URL = 'https://mediquote.test/api/v1';
    const token = 'mqai_personal-secret';
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://mediquote.test/api/v1/me');
      expect(new Headers(init?.headers).get('authorization')).toBe(`Bearer ${token}`);
      return new Response(JSON.stringify({
        user: { id: 'u1', email: 'u@example.com', name: 'User', role: 'comercial' },
        connection: { id: 'c1', label: 'Mi Claude', provider: 'claude' },
        capabilities: {
          readClients: true, createClient: false, readAttributions: true, createAttribution: true,
          changeAttributionStatus: true, extendAttribution: false, closeAttribution: true,
          readExpirations: true, readBudgets: false, listCommercials: true,
        },
      }), { status: 200 });
    }));
    await expect(resolveIdentity(token)).resolves.toMatchObject({ user: { id: 'u1', role: 'comercial' } });
  });

  it('propaga errores legibles', async () => {
    process.env.MEDIQUOTE_API_URL = 'https://mediquote.test/api/v1';
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'CIF no disponible', code: 'TAKEN' }), { status: 409 })));
    await expect(mediquoteRequest('mqai_x', 'atribucion')).rejects.toMatchObject({
      message: 'CIF no disponible', status: 409, code: 'TAKEN',
    });
  });
});
