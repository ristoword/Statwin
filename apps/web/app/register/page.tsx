'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="card">
      <h1>Registrati</h1>
      <p className="disclaimer">
        Devi avere almeno 18 anni. STATWIN è analisi statistica: le probabilità sono stime, non certezze.
      </p>
      <form onSubmit={onSubmit}>
        <input name="firstName" placeholder="Nome" />
        <input name="lastName" placeholder="Cognome" />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password (min 8)" required minLength={8} />
        <label>
          <input name="acceptTerms" type="checkbox" required /> Accetto termini, disclaimer e restrizione di età
        </label>
        {error ? <p className="disclaimer">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? 'Creazione...' : 'Crea account'}
        </button>
      </form>
    </div>
  );
}
