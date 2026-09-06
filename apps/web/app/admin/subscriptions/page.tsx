'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../../lib/api';
import { useAdminSession } from '../../../lib/admin-session';
import { formatDate } from '../../../lib/admin-format';

type Sub = {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd?: string | null;
  user?: { email?: string };
};

export default function Page() {
  const { token, ready, forbidden } = useAdminSession();
  const [items, setItems] = useState<Sub[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    apiGet<Sub[]>('/admin/subscriptions', token)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err: Error) => setError(err.message));
  }, [token]);

  if (!ready || forbidden || !token) return null;

  return (
    <div>
      <h1>Piani</h1>
      <p className="disclaimer">Abbonamenti attivi e periodo. Per assegnare un piano usa la sezione Utenti.</p>
      {error ? <p className="disclaimer">{error}</p> : null}
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Piano</th>
              <th>Stato</th>
              <th>Fino al</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={4}>Nessun abbonamento.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.user?.email ?? 'Account'}</td>
                  <td><span className="badge badge-ai">{item.plan}</span></td>
                  <td>{item.status}</td>
                  <td>{item.currentPeriodEnd ? formatDate(item.currentPeriodEnd) : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
