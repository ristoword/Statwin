export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('it-IT');
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('it-IT');
}

export function actionLabel(action: string): string {
  const map: Record<string, string> = {
    LOGIN_SUCCESS: 'Login riuscito',
    LOGIN_FAIL: 'Login fallito',
    LOGOUT: 'Logout',
    ADMIN_USER_CREATE: 'Account creato',
    ADMIN_USER_UPDATE: 'Account aggiornato',
    ADMIN_USER_BLOCK: 'Account bloccato',
    ADMIN_USER_UNBLOCK: 'Account sbloccato',
    ADMIN_PASSWORD_REGEN: 'Password rigenerata',
    ADMIN_PLAN_CHANGE: 'Piano modificato',
    FEATURE_AI_ANALYZE: 'Analisi AI',
    FEATURE_CHECKOUT: 'Checkout',
  };
  return map[action] ?? action;
}
