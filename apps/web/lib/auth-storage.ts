const ACCESS = 'statwin.accessToken';
const REFRESH = 'statwin.refreshToken';
const WEEK = 7 * 24 * 60 * 60;

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return;
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const row = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  if (!row) return null;
  try {
    return decodeURIComponent(row.slice(prefix.length)) || null;
  } catch {
    return null;
  }
}

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — cookie still keeps the session */
  }
}

function removeStorage(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function saveTokens(accessToken: string, refreshToken: string) {
  writeStorage(ACCESS, accessToken);
  writeStorage(REFRESH, refreshToken);
  writeCookie(ACCESS, accessToken, WEEK);
}

export function getAccessToken() {
  return readStorage(ACCESS) ?? readCookie(ACCESS);
}

export function clearTokens() {
  removeStorage(ACCESS);
  removeStorage(REFRESH);
  writeCookie(ACCESS, '', 0);
}
