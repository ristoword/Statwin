'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../../lib/api';
import { useAdminSession } from '../../../lib/admin-session';
import { formatDateTime } from '../../../lib/admin-format';

type Payment = {
  id: string;
  plan: string;
  status: string;
  amountCents: number;
  createdAt: string;
  user?: { email?: string };
};

export default function Page() {
  const { token, ready, forbidden } = useAdminSession();
  const [items, setItems] = useState<Payment[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    apiGet<Payment[]>('/admin/payments', token)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err: Error) => setError(err.message));
  }, [token]);

  if (!ready || forbidden || !token) return null;

  return (
    <div>
      <h1>Pagamenti</h1>
      <p className="disclaimer">Movimenti registrati. STATWIN è analytics, non un bookmaker.</p>
      {error ? <p className="disclaimer">{error}</p> : null}
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Account</th>
              <th>Piano</th>
              <th>Importo</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5}>Nessun pagamento.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.createdAt)}</td>
                  <td>{item.user?.email ?? 'Account'}</td>
                  <td>{item.plan}</td>
                  <td>{(item.amountCents / 100).toFixed(0)}€</td>
                  <td>{item.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
