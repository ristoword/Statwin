'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { useAdminToken } from '../../lib/session';
import { formatDateTime } from '../../lib/format';
import { ConfirmDialog } from '../../components/confirm-dialog';
import type { AdminUser, Paginated } from '../../lib/types';

export default function UsersPage() {
  const { token, ready } = useAdminToken();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState('');
  const [blocked, setBlocked] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<AdminUser | null>(null);

  async function load(currentToken: string, query = q, selectedPlan = plan, selectedBlocked = blocked) {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (selectedPlan) params.set('plan', selectedPlan);
    if (selectedBlocked) params.set('blocked', selectedBlocked);
    const data = await apiGet<Paginated<AdminUser>>(`/admin/users?${params.toString()}`, currentToken);
    setUsers(data.items ?? []);
    setTotal(data.total ?? 0);
  }

  useEffect(() => {
    if (!token) return;
    load(token).catch((err: Error) => setError(err.message));
    // initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    load(token).catch((err: Error) => setError(err.message));
  }

  async function changePlan(userId: string, nextPlan: string) {
    if (!token) return;
    setBusy(userId);
    setError('');
    try {
      await apiPatch(`/admin/users/${userId}/plan`, { plan: nextPlan }, token);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assegnazione piano non riuscita.');
    } finally {
      setBusy(null);
    }
  }

  async function confirmBlock() {
    if (!token || !confirm) return;
    setBusy(confirm.id);
    setError('');
    try {
      await apiPost(`/admin/users/${confirm.id}/block`, {}, token);
      setConfirm(null);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Blocco non riuscito.');
    } finally {
      setBusy(null);
    }
  }

  async function unblock(user: AdminUser) {
    if (!token) return;
    setBusy(user.id);
    setError('');
    try {
      await apiPost(`/admin/users/${user.id}/unblock`, {}, token);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sblocco non riuscito.');
    } finally {
      setBusy(null);
    }
  }

  if (!ready) return null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Utenti</h1>
          <p className="lede">
            {total} account. Cerca per email o nome, assegna piano, blocca l’accesso.
          </p>
        </div>
        <Link className="btn" href="/users/new">Nuovo account</Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <form className="toolbar" onSubmit={onSearch}>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Cerca email o nome"
        />
        <select value={plan} onChange={(event) => setPlan(event.target.value)}>
          <option value="">Tutti i piani</option>
          <option value="FREE">FREE</option>
          <option value="PREMIUM">PREMIUM</option>
          <option value="PRO">PRO</option>
        </select>
        <select value={blocked} onChange={(event) => setBlocked(event.target.value)}>
          <option value="">Tutti gli stati</option>
          <option value="false">Attivi</option>
          <option value="true">Bloccati</option>
        </select>
        <button type="submit" className="btn-ghost">Filtra</button>
      </form>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Piano</th>
              <th>Stato</th>
              <th>Ultimo accesso</th>
              <th>Creato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6}>Nessun utente in elenco.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Link className="link-row" href={`/users/${user.id}`}>{user.email}</Link>
                    <div style={{ color: 'var(--muted)', fontSize: 11 }}>
                      {user.firstName || user.lastName
                        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                        : user.role}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-plan">{user.subscription?.plan ?? 'FREE'}</span>
                  </td>
                  <td>
                    <span className={user.isActive ? 'badge badge-ok' : 'badge badge-off'}>
                      {user.isActive ? 'Attivo' : 'Bloccato'}
                    </span>
                  </td>
                  <td>{formatDateTime(user.lastLoginAt)}</td>
                  <td>{formatDateTime(user.createdAt)}</td>
                  <td>
                    <div className="actions">
                      <Link className="btn btn-sm btn-ghost" href={`/users/${user.id}`}>Apri</Link>
                      {user.isActive ? (
                        <button type="button" className="btn-sm btn-danger" onClick={() => setConfirm(user)}>
                          Blocca
                        </button>
                      ) : (
                        <button type="button" className="btn-sm btn-ghost" onClick={() => unblock(user)}>
                          Sblocca
                        </button>
                      )}
                      <select
                        value={user.subscription?.plan ?? 'FREE'}
                        disabled={busy === user.id}
                        onChange={(event) => changePlan(user.id, event.target.value)}
                      >
                        <option value="FREE">FREE</option>
                        <option value="PREMIUM">PREMIUM</option>
                        <option value="PRO">PRO</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Bloccare l’account?"
        body={confirm ? `${confirm.email} non potrà più accedere. Le sessioni attive verranno invalidate.` : ''}
        confirmLabel="Blocca utente"
        danger
        busy={busy === confirm?.id}
        onCancel={() => setConfirm(null)}
        onConfirm={confirmBlock}
      />
    </div>
  );
}
