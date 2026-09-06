'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';

type Payment = {
  id: string;
  plan: string;
  status: string;
  amountCents: number;
  createdAt: string;
  user?: { email?: string };
};

export default function Page() {
  const [items, setItems] = useState<Payment[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('statwin.admin.token');
    if (!token) {
      setError('Login admin richiesto.');
      return;
    }
    apiGet<Payment[]>('/admin/payments', token)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setError('Pagamenti non disponibili.'));
  }, []);

  return (
    <div>
      <h1>Pagamenti</h1>
      {error ? <p>{error}</p> : null}
      {items.length === 0 ? (
        <div className="card">Nessun pagamento.</div>
      ) : (
        items.map((item) => (
          <div className="card" key={item.id}>
            <h3>{item.user?.email ?? 'Account'}</h3>
            <p>
              {item.plan} · {(item.amountCents / 100).toFixed(0)}€ · {item.status} ·{' '}
              {new Date(item.createdAt).toLocaleString('it-IT')}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
