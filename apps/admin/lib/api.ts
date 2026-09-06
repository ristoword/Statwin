function trimApiSuffix(value: string): string {
  return value.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

export function getApiOrigin(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== 'undefined') {
    if (publicUrl && publicUrl !== 'same-origin') {
      return trimApiSuffix(publicUrl);
    }
    return '';
  }

  const internal = process.env.API_INTERNAL_URL;
  if (internal) return trimApiSuffix(internal);
  if (publicUrl && publicUrl !== 'same-origin') return trimApiSuffix(publicUrl);
  return 'http://127.0.0.1:3001';
}

export function apiV1(): string {
  const origin = getApiOrigin();
  return origin ? `${origin}/api/v1` : '/api/v1';
}

export const API_ORIGIN = getApiOrigin();
export const API_V1 = apiV1();

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${apiV1()}${path}`, { cache: 'no-store', headers });
  if (!res.ok) throw new Error(`Errore API ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${apiV1()}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Errore API ${res.status}`);
  return res.json() as Promise<T>;
}
