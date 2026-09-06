'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { useAdminSession } from '../../lib/admin-session';
import { actionLabel, formatDateTime } from '../../lib/admin-format';
import type { Overview } from '../../lib/admin-types';

export default function AdminHome() {
  const { token, ready, forbidden } = useAdminSession();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    apiGet<Overview>('/admin/overview', token)
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [token]);

  if (!ready || forbidden || !token) return null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Account</h1>
          <p className="disclaimer">
            Control room account: chi accede, con quale piano e quando. Nessuna impersonazione —
            operazioni solo via API admin.
          </p>
        </div>
        <Link className="btn" href="/admin/users/new">Crea account PRO</Link>
      </div>
      {error ? <p className="disclaimer">{error}</p> : null}
      <div className="grid">
        <div className="card stat"><span>Utenti</span><strong>{data?.users ?? '—'}</strong></div>
        <div className="card stat"><span>PRO</span><strong>{data?.plans?.PRO ?? '—'}</strong></div>
        <div className="card stat"><span>Premium</span><strong>{data?.plans?.PREMIUM ?? '—'}</strong></div>
        <div className="card stat"><span>Free</span><strong>{data?.plans?.FREE ?? '—'}</strong></div>
        <div className="card stat"><span>Bloccati</span><strong>{data?.blocked ?? '—'}</strong></div>
        <div className="card stat"><span>Login 24h</span><strong>{data?.logins24h ?? '—'}</strong></div>
      </div>
      <h2>Accessi recenti</h2>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Azione</th>
              <th>Utente</th>
              <th>Attore</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recentAudit ?? []).length === 0 ? (
              <tr><td colSpan={5}>Nessun evento di accesso.</td></tr>
            ) : (
              data?.recentAudit.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.createdAt)}</td>
                  <td>{actionLabel(row.action)}</td>
                  <td>{row.user?.email ?? '—'}</td>
                  <td>{row.actor?.email ?? '—'}</td>
                  <td>{row.ip ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
