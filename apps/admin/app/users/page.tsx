'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../../lib/api';

type UserRow = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  subscription?: { plan: string; status: string } | null;
};

export default function Page() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load(token: string) {
    const data = await apiGet<UserRow[]>('/admin/users', token);
    setUsers(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    const token = localStorage.getItem('statwin.admin.token');
    if (!token) {
      setError('Login admin richiesto.');
      return;
    }
    load(token).catch(() => setError('Utenti non disponibili.'));
  }, []);

  async function changePlan(userId: string, plan: string) {
    const token = localStorage.getItem('statwin.admin.token');
    if (!token) return;
    setBusy(userId);
    setError('');
    try {
      await apiPatch(`/admin/users/${userId}/plan`, { plan }, token);
      await load(token);
    } catch {
      setError('Assegnazione piano non riuscita.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1>Utenti</h1>
      <p>I piani limitano funzioni: Free = dati/statistiche, Premium = probabilità, Pro = analisi AI.</p>
      {error ? <p>{error}</p> : null}
      {users.length === 0 ? (
        <div className="card">Nessun utente in elenco.</div>
      ) : (
        users.map((user) => (
          <div className="card" key={user.id}>
            <h3>{user.email}</h3>
            <p>
              Ruolo {user.role} · Piano {user.subscription?.plan ?? 'FREE'} · {user.subscription?.status ?? 'n/d'}
            </p>
            <label>
              Assegna piano
              <select
                value={user.subscription?.plan ?? 'FREE'}
                disabled={busy === user.id}
                onChange={(event) => changePlan(user.id, event.target.value)}
              >
                <option value="FREE">FREE</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="PRO">PRO</option>
              </select>
            </label>
          </div>
        ))
      )}
    </div>
  );
}
