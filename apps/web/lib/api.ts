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
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  return apiWrite<T>('POST', path, body, token);
}

export async function apiPatch<T>(path: string, body: unknown, token?: string): Promise<T> {
  return apiWrite<T>('PATCH', path, body, token);
}

async function apiWrite<T>(
  method: 'POST' | 'PATCH',
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${apiV1()}${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<T>;
}

function asErrorText(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const parts = value.filter((item): item is string => typeof item === 'string');
    return parts.length ? parts.join(', ') : undefined;
  }
  return typeof value === 'string' && value.trim() ? value : undefined;
}

async function readError(res: Response): Promise<string> {
  try {
    const payload = (await res.json()) as {
      message?: unknown;
      error?: unknown;
    };
    const top = asErrorText(payload.message);
    if (top) return top;
    if (payload.error && typeof payload.error === 'object') {
      const nested = payload.error as { message?: unknown };
      const inner = asErrorText(nested.message);
      if (inner) return inner;
    }
    const rawError = asErrorText(payload.error);
    if (rawError) return rawError;
  } catch {
    /* ignore */
  }
  if (res.status === 401) return 'Password attuale non corretta.';
  if (res.status === 409) return 'Email già in uso.';
  return `Errore API ${res.status}`;
}
