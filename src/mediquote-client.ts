import { requireEnv } from './env.js';

export class MediQuoteApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'MediQuoteApiError';
  }
}

function baseUrl(): string {
  return requireEnv('MEDIQUOTE_API_URL').replace(/\/+$/, '');
}

function token(): string {
  return requireEnv('MEDIQUOTE_API_TOKEN');
}

export async function mediquoteRequest<T>(
  path: string,
  init: RequestInit = {},
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(`${baseUrl()}/${path.replace(/^\/+/, '')}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token()}`,
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try { payload = JSON.parse(text); }
    catch { payload = { error: text }; }
  }

  if (!response.ok) {
    const object = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    const message = typeof object.error === 'string' ? object.error : `MediQuote respondió HTTP ${response.status}`;
    const code = typeof object.code === 'string' ? object.code : undefined;
    throw new MediQuoteApiError(message, response.status, code);
  }
  return payload as T;
}
