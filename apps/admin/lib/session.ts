'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const ADMIN_TOKEN_KEY = 'statwin.admin.token';

export function readAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function useAdminToken() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const value = readAdminToken();
    if (!value) {
      router.replace('/login');
    }
    setToken(value);
    setReady(true);
  }, [router]);

  return { token, ready };
}
