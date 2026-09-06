const ACCESS = 'statwin.accessToken';
const REFRESH = 'statwin.refreshToken';

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS, accessToken);
  localStorage.setItem(REFRESH, refreshToken);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}
