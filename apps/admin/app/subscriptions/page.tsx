'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';

type Sub = {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd?: string | null;
  user?: { email?: string };
};

export default function Page() {
  const [items, setItems] = useState<Sub[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('statwin.admin.token');
    if (!token) {
      setError('Login admin richiesto.');
      return;
    }
    apiGet<Sub[]>('/admin/subscriptions', token)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setError('Abbonamenti non disponibili.'));
  }, []);

  return (
    <div>
      <h1>Abbonamenti</h1>
      {error ? <p>{error}</p> : null}
      {items.length === 0 ? (
        <div className="card">Nessun abbonamento.</div>
      ) : (
        items.map((item) => (
          <div className="card" key={item.id}>
            <h3>{item.user?.email ?? 'Account'}</h3>
            <p>
              {item.plan} · {item.status}
              {item.currentPeriodEnd ? ` · fino al ${new Date(item.currentPeriodEnd).toLocaleDateString('it-IT')}` : ''}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
