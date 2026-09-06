'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiGet, apiPatch, apiPost } from '../../../lib/api';
import { useAdminToken } from '../../../lib/session';
import { actionLabel, formatDateTime } from '../../../lib/format';
import { ConfirmDialog } from '../../../components/confirm-dialog';
import type { PasswordOnce, UserDossier } from '../../../lib/types';

type ConfirmKind = 'block' | 'password' | null;

export default function UserDossierPage() {
  const { id } = useParams<{ id: string }>();
  const { token, ready } = useAdminToken();
  const [data, setData] = useState<UserDossier | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [passwordOnce, setPasswordOnce] = useState<PasswordOnce | null>(null);
  const [copied, setCopied] = useState(false);

  async function load(currentToken: string) {
    const dossier = await apiGet<UserDossier>(`/admin/users/${id}`, currentToken);
    setData(dossier);
  }

  useEffect(() => {
    if (!token || !id) return;
    load(token).catch((err: Error) => setError(err.message));
  }, [token, id]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await apiPatch(`/admin/users/${id}`, {
        email: String(form.get('email') ?? ''),
        firstName: String(form.get('firstName') ?? ''),
        lastName: String(form.get('lastName') ?? ''),
        role: String(form.get('role') ?? 'USER'),
      }, token);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aggiornamento non riuscito.');
    } finally {
      setBusy(false);
    }
  }

  async function changePlan(plan: string) {
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      await apiPatch(`/admin/users/${id}/plan`, { plan }, token);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assegnazione piano non riuscita.');
    } finally {
      setBusy(false);
    }
  }

  async function runConfirm() {
    if (!token || !confirm) return;
    setBusy(true);
    setError('');
    try {
      if (confirm === 'block') {
        if (data?.profile.isActive) {
          await apiPost(`/admin/users/${id}/block`, {}, token);
        } else {
          await apiPost(`/admin/users/${id}/unblock`, {}, token);
        }
      } else {
        const result = await apiPost<PasswordOnce>(`/admin/users/${id}/password`, {}, token);
        setPasswordOnce(result);
        setCopied(false);
      }
      setConfirm(null);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operazione non riuscita.');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;
  const profile = data?.profile;
  const usage = data?.usage;
  const payments = data?.payments ?? [];
  const access = data?.access ?? [];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dossier account</h1>
          <p className="lede">
            Email di registrazione, piano, accessi e controlli. L’impersonazione non è consentita.
          </p>
        </div>
        <Link className="btn-ghost btn" href="/users">Tutti gli utenti</Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {passwordOnce ? (
        <div className="notice">
          <p>Nuova password temporanea — mostrata una sola volta.</p>
          <p className="password-once">{passwordOnce.temporaryPassword}</p>
          <p>{passwordOnce.note}</p>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(passwordOnce.temporaryPassword);
              setCopied(true);
            }}
          >
            {copied ? 'Copiata' : 'Copia password'}
          </button>
        </div>
      ) : null}
      {profile ? (
        <>
          <div className="dossier">
            <div className="card">
              <div className="field">Email registrazione</div>
              <div className="value">{profile.email}</div>
            </div>
            <div className="card">
              <div className="field">Piano</div>
              <div className="value">{profile.subscription?.plan ?? 'FREE'}</div>
            </div>
            <div className="card">
              <div className="field">Stato</div>
              <div className="value">{profile.isActive ? 'Attivo' : 'Bloccato'}</div>
            </div>
            <div className="card">
              <div className="field">Ultimo accesso</div>
              <div className="value">{formatDateTime(profile.lastLoginAt)}</div>
            </div>
            <div className="card">
              <div className="field">Ultima attività</div>
              <div className="value">{formatDateTime(usage?.lastActivityAt)}</div>
            </div>
            <div className="card">
              <div className="field">Utilizzo</div>
              <div className="value">
                {usage?.aiReports ?? 0} report AI · {usage?.payments ?? 0} pagamenti
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Controlli</h3>
            <p className="lede">Apri come utente non è consentito. Operazioni solo da questa control room.</p>
            <div className="actions">
              <button
                type="button"
                className={profile.isActive ? 'btn-danger' : ''}
                onClick={() => setConfirm('block')}
              >
                {profile.isActive ? 'Blocca utente' : 'Sblocca utente'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setConfirm('password')}>
                Rigenera password
              </button>
              <label style={{ minWidth: 180 }}>
                <span>Assegna piano</span>
                <select
                  value={profile.subscription?.plan ?? 'FREE'}
                  disabled={busy}
                  onChange={(event) => changePlan(event.target.value)}
                >
                  <option value="FREE">FREE</option>
                  <option value="PREMIUM">PREMIUM</option>
                  <option value="PRO">PRO</option>
                </select>
              </label>
            </div>
          </div>

          <form className="card" onSubmit={saveProfile}>
            <h3>Profilo</h3>
            <label>
              <span>Email</span>
              <input name="email" type="email" defaultValue={profile.email} required />
            </label>
            <label>
              <span>Nome</span>
              <input name="firstName" defaultValue={profile.firstName ?? ''} />
            </label>
            <label>
              <span>Cognome</span>
              <input name="lastName" defaultValue={profile.lastName ?? ''} />
            </label>
            <label>
              <span>Ruolo</span>
              <select name="role" defaultValue={profile.role}>
                <option value="USER">USER</option>
                <option value="PREMIUM_USER">PREMIUM_USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <p className="lede">Creato il {formatDateTime(profile.createdAt)} · ruolo {profile.role}</p>
            <button type="submit" disabled={busy}>Salva profilo</button>
          </form>

          <h2>Pagamenti</h2>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Piano</th>
                  <th>Importo</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={4}>Nessun pagamento.</td></tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatDateTime(payment.createdAt)}</td>
                      <td>{payment.plan}</td>
                      <td>{(payment.amountCents / 100).toFixed(0)} {payment.currency.toUpperCase()}</td>
                      <td>{payment.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2>Accessi e audit</h2>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Azione</th>
                  <th>Attore</th>
                  <th>IP</th>
                  <th>Percorso</th>
                </tr>
              </thead>
              <tbody>
                {access.length === 0 ? (
                  <tr><td colSpan={5}>Nessun evento.</td></tr>
                ) : (
                  access.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDateTime(row.createdAt)}</td>
                      <td>{actionLabel(row.action)}</td>
                      <td>{row.actor?.email ?? '—'}</td>
                      <td>{row.ip ?? '—'}</td>
                      <td>{row.path ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card">Caricamento dossier…</div>
      )}

      <ConfirmDialog
        open={confirm === 'block'}
        title={profile?.isActive ? 'Bloccare l’account?' : 'Sbloccare l’account?'}
        body={
          profile?.isActive
            ? `${profile.email} non potrà più accedere. Le sessioni attive verranno invalidate.`
            : `${profile?.email ?? ''} potrà di nuovo accedere.`
        }
        confirmLabel={profile?.isActive ? 'Blocca' : 'Sblocca'}
        danger={profile?.isActive}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
      <ConfirmDialog
        open={confirm === 'password'}
        title="Rigenerare la password?"
        body="Verrà emessa una password temporanea mostrata una sola volta. Le sessioni attive saranno invalidate."
        confirmLabel="Rigenera"
        danger
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </div>
  );
}
