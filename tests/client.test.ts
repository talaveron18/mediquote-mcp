import { afterEach, describe, expect, it, vi } from 'vitest';
import { mediquoteRequest, MediQuoteApiError } from '../src/mediquote-client.js';

const originalUrl = process.env.MEDIQUOTE_API_URL;
const originalToken = process.env.MEDIQUOTE_API_TOKEN;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalUrl === undefined) delete process.env.MEDIQUOTE_API_URL; else process.env.MEDIQUOTE_API_URL = originalUrl;
  if (originalToken === undefined) delete process.env.MEDIQUOTE_API_TOKEN; else process.env.MEDIQUOTE_API_TOKEN = originalToken;
});

describe('MediQuote REST client', () => {
  it('envía bearer, query y devuelve JSON', async () => {
    process.env.MEDIQUOTE_API_URL = 'https://mediquote.test/api/v1/';
    process.env.MEDIQUOTE_API_TOKEN = 'api-secret';
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://mediquote.test/api/v1/clientes?search=acme');
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer api-secret');
      return new Response(JSON.stringify([{ cif: 'B123' }]), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(mediquoteRequest('clientes', {}, { search: 'acme' })).resolves.toEqual([{ cif: 'B123' }]);
  });

  it('propaga errores legibles', async () => {
    process.env.MEDIQUOTE_API_URL = 'https://mediquote.test/api/v1';
    process.env.MEDIQUOTE_API_TOKEN = 'api-secret';
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'CIF no disponible', code: 'TAKEN' }), { status: 409 })));
    await expect(mediquoteRequest('atribucion')).rejects.toMatchObject<MediQuoteApiError>({
      message: 'CIF no disponible', status: 409, code: 'TAKEN',
    });
  });
});
