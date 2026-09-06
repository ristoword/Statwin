'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '../../lib/api';
import { saveTokens } from '../../lib/auth-storage';

type AuthResponse = { accessToken: string; refreshToken: string };

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const tokens = await apiPost<AuthResponse>('/auth/login', {
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
      });
      saveTokens(tokens.accessToken, tokens.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login non riuscito');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1>Login</h1>
      <p className="disclaimer">Piattaforma di analisi statistica. 18+. Nessuna promessa di vincita.</p>
      <form onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required minLength={8} />
        {error ? <p className="disclaimer">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? 'Accesso...' : 'Entra'}
        </button>
      </form>
      <p>
        <a href="/register">Crea un account</a>
      </p>
    </div>
  );
}
