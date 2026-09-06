'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../../lib/api';
import { useAdminSession } from '../../../lib/admin-session';

type Sport = { slug: string; name: string; isActive: boolean };

export default function SportsPage() {
  const { token, ready, forbidden } = useAdminSession();
  const [sports, setSports] = useState<Sport[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    apiGet<Sport[]>('/sports', token)
      .then((data) => setSports(Array.isArray(data) ? data : []))
      .catch((err: Error) => setError(err.message));
  }, [token]);

  if (!ready || forbidden || !token) return null;

  return (
    <section>
      <h1>Sport</h1>
      <p className="disclaimer">Catalogo sport del desk. Nessun risultato inventato.</p>
      {error ? <p className="disclaimer">{error}</p> : null}
      {sports.length === 0 ? (
        <div className="card">Nessuno sport in catalogo.</div>
      ) : (
        sports.map((sport) => (
          <div className="card" key={sport.slug}>
            {sport.name} — {sport.isActive ? 'attivo' : 'predisposto'}
          </div>
        ))
      )}
    </section>
  );
}
