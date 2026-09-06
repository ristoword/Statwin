export function readJwtRole(accessToken: string | null | undefined): string | undefined {
  if (!accessToken) return undefined;
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1] ?? '')) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : undefined;
  } catch {
    return undefined;
  }
}
