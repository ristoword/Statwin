'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

type Health = { status: string; checks?: { database: string; redis: string } };
type Sport = { slug: string; name: string; isActive: boolean };
type Overview = { users?: number; sports?: Sport[] };

export default function AdminHome() {
  const [health, setHealth] = useState<Health | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    apiGet<Health>('/health').then(setHealth).catch(() => setHealth({ status: 'down' }));
    apiGet<Sport[]>('/sports').then((data) => setSports(Array.isArray(data) ? data : [])).catch(() => setSports([]));
    const token = localStorage.getItem('statwin.admin.token');
    if (token) {
      apiGet<Overview>('/admin/overview', token).then(setOverview).catch(() => setOverview(null));
    }
  }, []);

  return (
    <div>
      <h1>STATWIN Admin</h1>
      <div className="card">
        <p>Stato API: {health?.status ?? 'sconosciuto'}</p>
        <p>Database: {health?.checks?.database ?? 'n/d'} · Redis: {health?.checks?.redis ?? 'n/d'}</p>
        {overview?.users != null ? <p>Utenti: {overview.users}</p> : <p><a href="/login">Login admin</a> per i conteggi protetti.</p>}
      </div>
      <div className="grid">
        {sports.map((sport) => (
          <div className="card" key={sport.slug}>
            {sport.name} {sport.isActive ? '(attivo)' : '(predisposto)'}
          </div>
        ))}
      </div>
    </div>
  );
}
