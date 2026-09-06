'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiGet } from './api';
import { getAccessToken } from './auth-storage';
import { readJwtRole } from './jwt-role';

export function useAdminSession() {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const value = getAccessToken();
    if (!value) {
      const next = pathname?.startsWith('/') ? pathname : '/admin';
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      setToken(null);
      setForbidden(false);
      setReady(true);
      return;
    }

    const accessToken = value;

    async function resolveRole() {
      if (readJwtRole(accessToken) === 'ADMIN') {
        if (!cancelled) {
          setToken(accessToken);
          setForbidden(false);
          setReady(true);
        }
        return;
      }
      try {
        const me = await apiGet<{ role?: string }>('/users/me', accessToken);
        if (cancelled) return;
        if (me.role === 'ADMIN') {
          setToken(accessToken);
          setForbidden(false);
        } else {
          setToken(null);
          setForbidden(true);
        }
      } catch {
        if (cancelled) return;
        setToken(null);
        setForbidden(true);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void resolveRole();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return { token, ready, forbidden };
}

/** @deprecated alias used by ported admin pages */
export function useAdminToken() {
  const session = useAdminSession();
  return { token: session.token, ready: session.ready, forbidden: session.forbidden };
}
