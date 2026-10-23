export function bearerToken(request: Request): string | null {
  const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() ?? '';
  return token.startsWith('mqai_') && token.length >= 30 ? token : null;
}

export function unauthorized(message = 'Unauthorized'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'www-authenticate': 'Bearer realm="mediquote-mcp"',
    },
  });
}
