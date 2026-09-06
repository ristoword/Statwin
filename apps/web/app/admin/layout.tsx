'use client';

import { AdminForbidden } from '../../components/admin-forbidden';
import { AdminNav } from '../../components/admin-nav';
import { useAdminSession } from '../../lib/admin-session';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, ready, forbidden } = useAdminSession();

  if (!ready) {
    return <p className="muted">Caricamento control room...</p>;
  }
  if (forbidden) {
    return <AdminForbidden />;
  }
  if (!token) {
    return <p className="muted">Reindirizzamento al login...</p>;
  }

  return (
    <div className="admin-desk">
      <p className="kicker">Control room</p>
      <AdminNav />
      {children}
    </div>
  );
}
