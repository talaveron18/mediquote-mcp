export function getEnv(name: string): string | undefined {
  const netlify = (globalThis as typeof globalThis & {
    Netlify?: { env?: { get?: (key: string) => string | undefined } };
  }).Netlify;
  return netlify?.env?.get?.(name) ?? process.env[name];
}

export function requireEnv(name: string): string {
  const value = getEnv(name)?.trim();
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}
