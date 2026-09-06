const ACCESS = 'statwin.accessToken';
const REFRESH = 'statwin.refreshToken';
const WEEK = 7 * 24 * 60 * 60;

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS, accessToken);
  localStorage.setItem(REFRESH, refreshToken);
  writeCookie(ACCESS, accessToken, WEEK);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  writeCookie(ACCESS, '', 0);
}
