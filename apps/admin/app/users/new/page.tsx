'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { apiPost } from '../../../lib/api';
import { useAdminToken } from '../../../lib/session';
import type { PasswordOnce } from '../../../lib/types';

export default function NewUserPage() {
  const { token, ready } = useAdminToken();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<PasswordOnce | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const result = await apiPost<PasswordOnce>('/admin/users', {
        email: String(form.get('email') ?? ''),
        firstName: String(form.get('firstName') ?? '') || undefined,
        lastName: String(form.get('lastName') ?? '') || undefined,
        plan: String(form.get('plan') ?? 'PRO'),
        role: String(form.get('role') ?? 'USER'),
      }, token);
      setCreated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creazione non riuscita.');
    } finally {
      setBusy(false);
    }
  }

  async function copyPassword() {
    if (!created?.temporaryPassword) return;
    await navigator.clipboard.writeText(created.temporaryPassword);
    setCopied(true);
  }

  if (!ready) return null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Nuovo account</h1>
          <p className="lede">
            Crea un account (tipicamente PRO) con email di registrazione. La password temporanea
            viene mostrata una sola volta e non è mai salvata in chiaro.
          </p>
        </div>
        <Link className="btn-ghost btn" href="/users">Torna agli utenti</Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {created ? (
        <div className="notice">
          <p>Account creato per <strong>{created.user?.email}</strong> · piano {created.user?.subscription?.plan ?? '—'}</p>
          <p className="password-once">{created.temporaryPassword}</p>
          <p>{created.note}</p>
          <div className="actions">
            <button type="button" onClick={copyPassword}>{copied ? 'Copiata' : 'Copia password'}</button>
            {created.user ? (
              <Link className="btn-ghost btn" href={`/users/${created.user.id}`}>Apri dossier</Link>
            ) : null}
          </div>
        </div>
      ) : null}
      <form className="card" onSubmit={onSubmit}>
        <label>
          <span>Email di registrazione</span>
          <input name="email" type="email" required placeholder="utente@azienda.it" />
        </label>
        <label>
          <span>Nome</span>
          <input name="firstName" placeholder="Nome" />
        </label>
        <label>
          <span>Cognome</span>
          <input name="lastName" placeholder="Cognome" />
        </label>
        <label>
          <span>Piano</span>
          <select name="plan" defaultValue="PRO">
            <option value="PRO">PRO</option>
            <option value="PREMIUM">PREMIUM</option>
            <option value="FREE">FREE</option>
          </select>
        </label>
        <label>
          <span>Ruolo</span>
          <select name="role" defaultValue="USER">
            <option value="USER">USER</option>
            <option value="PREMIUM_USER">PREMIUM_USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Creazione…' : 'Crea account'}</button>
      </form>
    </div>
  );
}
