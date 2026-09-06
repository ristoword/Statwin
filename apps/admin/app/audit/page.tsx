'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { useAdminToken } from '../../lib/session';
import { actionLabel, formatDateTime } from '../../lib/format';
import type { AuditRow, Paginated } from '../../lib/types';

const ACTIONS = [
  '',
  'LOGIN_SUCCESS',
  'LOGIN_FAIL',
  'LOGOUT',
  'ADMIN_USER_CREATE',
  'ADMIN_USER_UPDATE',
  'ADMIN_USER_BLOCK',
  'ADMIN_USER_UNBLOCK',
  'ADMIN_PASSWORD_REGEN',
  'ADMIN_PLAN_CHANGE',
  'FEATURE_AI_ANALYZE',
  'FEATURE_CHECKOUT',
];

export default function AuditPage() {
  const { token, ready } = useAdminToken();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [email, setEmail] = useState('');
  const [action, setAction] = useState('');
  const [error, setError] = useState('');

  async function load(currentToken: string, selectedEmail = email, selectedAction = action) {
    const params = new URLSearchParams();
    if (selectedEmail.trim()) params.set('email', selectedEmail.trim());
    if (selectedAction) params.set('action', selectedAction);
    params.set('take', '80');
    const data = await apiGet<Paginated<AuditRow>>(`/admin/audit?${params.toString()}`, currentToken);
    setRows(data.items ?? []);
    setTotal(data.total ?? 0);
  }

  useEffect(() => {
    if (!token) return;
    load(token).catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    load(token).catch((err: Error) => setError(err.message));
  }

  if (!ready) return null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Accessi</h1>
          <p className="lede">
            Registro globale: chi ha fatto cosa e quando. {total} eventi.
          </p>
        </div>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <form className="toolbar" onSubmit={onSearch}>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Filtra per email"
        />
        <select value={action} onChange={(event) => setAction(event.target.value)}>
          {ACTIONS.map((value) => (
            <option key={value || 'all'} value={value}>
              {value ? actionLabel(value) : 'Tutte le azioni'}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-ghost">Filtra</button>
      </form>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Azione</th>
              <th>Utente</th>
              <th>Attore</th>
              <th>IP</th>
              <th>Percorso</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6}>Nessun accesso registrato.</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.createdAt)}</td>
                  <td>{actionLabel(row.action)}</td>
                  <td>
                    {row.user ? (
                      <Link className="link-row" href={`/users/${row.user.id}`}>{row.user.email}</Link>
                    ) : '—'}
                  </td>
                  <td>{row.actor?.email ?? '—'}</td>
                  <td>{row.ip ?? '—'}</td>
                  <td>{row.path ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
