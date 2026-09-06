'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../../../lib/auth-storage';
import { readJwtRole } from '../../../lib/jwt-role';
import { AdminForbidden } from '../../../components/admin-forbidden';

export default function AdminLoginPage() {
  const router = useRouter();
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login?next=/admin');
      return;
    }
    if (readJwtRole(token) === 'ADMIN') {
      router.replace('/admin');
      return;
    }
    setForbidden(true);
  }, [router]);

  if (forbidden) {
    return <AdminForbidden />;
  }

  return <p className="muted">Reindirizzamento al login...</p>;
}
