'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import { getAccessToken } from '../lib/auth-storage';

export type AccountProfile = {
  email: string;
  phone?: string | null;
  firstName?: string | null;
  role: string;
  subscription?: { plan: string; status: string } | null;
};

export function AccountForm({
  onProfile,
}: {
  onProfile?: (profile: AccountProfile) => void;
}) {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileOk, setProfileOk] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordOk, setPasswordOk] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    setReady(true);
    setAuthed(Boolean(token));
    if (!token) {
      return;
    }
    apiGet<AccountProfile>('/users/me', token)
      .then((data) => {
        setProfile(data);
        setEmail(data.email);
        setPhone(data.phone ?? '');
        onProfile?.(data);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [onProfile]);

  if (!ready) {
    return <p className="muted">Caricamento account...</p>;
  }

  if (!authed && !profile) {
    return (
      <p>
        <Link className="btn" href="/login?next=/settings">
          Accedi
        </Link>{' '}
        per aggiornare email, telefono e password.
      </p>
    );
  }

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setProfileError('');
    setProfileOk('');
    setProfileBusy(true);
    const emailChanged = email.trim().toLowerCase() !== (profile?.email ?? '').toLowerCase();
    try {
      const updated = await apiPatch<AccountProfile>(
        '/users/me',
        {
          email: email.trim(),
          phone,
          currentPassword: emailChanged ? profilePassword : undefined,
        },
        token,
      );
      setProfile(updated);
      setEmail(updated.email);
      setPhone(updated.phone ?? '');
      setProfilePassword('');
      setProfileOk('Profilo aggiornato.');
      onProfile?.(updated);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Aggiornamento non riuscito.');
    } finally {
      setProfileBusy(false);
    }
  }

  async function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setPasswordError('');
    setPasswordOk('');
    if (newPassword !== confirmPassword) {
      setPasswordError('La conferma non coincide con la nuova password.');
      return;
    }
    setPasswordBusy(true);
    try {
      await apiPost<{ success: boolean }>(
        '/users/me/password',
        { currentPassword, newPassword },
        token,
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOk('Password aggiornata. Resta connesso su questo dispositivo.');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Cambio password non riuscito.');
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <div className="account-grid">
      <form onSubmit={onSaveProfile}>
        <p className="kicker">Contatti</p>
        <h3>Email e telefono</h3>
        <p className="muted">Il telefono è opzionale. La sessione resta attiva dopo il cambio email.</p>
        {loadError ? <p className="form-err">{loadError}</p> : null}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Telefono (opzionale)</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="+39 333 123 4567"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Password attuale (solo per cambiare email)</span>
          <input
            type="password"
            name="currentPasswordEmail"
            autoComplete="current-password"
            minLength={8}
            value={profilePassword}
            onChange={(event) => setProfilePassword(event.target.value)}
          />
        </label>
        {profileError ? <p className="form-err">{profileError}</p> : null}
        {profileOk ? <p className="form-ok">{profileOk}</p> : null}
        <button type="submit" disabled={profileBusy}>
          {profileBusy ? 'Salvataggio...' : 'Salva profilo'}
        </button>
      </form>

      <form onSubmit={onChangePassword}>
        <p className="kicker">Sicurezza</p>
        <h3>Cambia password</h3>
        <p className="muted">Minimo 8 caratteri. Le altre sessioni verranno chiuse.</p>
        <label className="field">
          <span>Password attuale</span>
          <input
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            required
            minLength={8}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Nuova password</span>
          <input
            type="password"
            name="newPassword"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Conferma nuova password</span>
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        {passwordError ? <p className="form-err">{passwordError}</p> : null}
        {passwordOk ? <p className="form-ok">{passwordOk}</p> : null}
        <button type="submit" disabled={passwordBusy}>
          {passwordBusy ? 'Aggiornamento...' : 'Aggiorna password'}
        </button>
      </form>
    </div>
  );
}
