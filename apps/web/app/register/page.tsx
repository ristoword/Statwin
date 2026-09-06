'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandMark } from '../../components/brand-mark';
import { apiPost } from '../../lib/api';
import { saveTokens } from '../../lib/auth-storage';

type AuthResponse = { accessToken: string; refreshToken: string };

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const tokens = await apiPost<AuthResponse>('/auth/register', {
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
        firstName: String(form.get('firstName') ?? '') || undefined,
        lastName: String(form.get('lastName') ?? '') || undefined,
        acceptTerms: form.get('acceptTerms') === 'on',
      });
      saveTokens(tokens.accessToken, tokens.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrazione non riuscita');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-story">
        <BrandMark size={72} />
        <p className="kicker">Onboarding</p>
        <h1>Un posto nel desk.</h1>
        <p>
          Accesso riservato ai maggiorenni. STATWIN non è un bookmaker: legge i dati, calcola,
          stima e commenta. Niente di più.
        </p>
      </div>
      <div className="auth card">
        <p className="kicker">Nuovo profilo</p>
        <h2 style={{ marginTop: 8 }}>Crea account</h2>
        <form onSubmit={onSubmit}>
          <div className="grid-2">
            <input name="firstName" placeholder="Nome" />
            <input name="lastName" placeholder="Cognome" />
          </div>
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password (min 8)" required minLength={8} />
          <label>
            <input name="acceptTerms" type="checkbox" required /> Accetto termini, disclaimer e restrizione di età
          </label>
          {error ? <p className="disclaimer">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? 'Creazione...' : 'Entra in piattaforma'}
          </button>
        </form>
        <p className="muted">
          Hai già un account? <Link href="/login">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
