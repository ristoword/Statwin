export const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
).replace(/\/api\/v1\/?$/, '');

export const API_V1 = `${API_ORIGIN}/api/v1`;

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_V1}${path}`, { cache: 'no-store', headers });
  if (!res.ok) throw new Error(`Errore API ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_V1}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Errore API ${res.status}`);
  return res.json() as Promise<T>;
}
