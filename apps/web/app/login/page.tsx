'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandMark } from '../../components/brand-mark';
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
        email: String(form.get('email') ?? '').trim(),
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
    <div className="auth-shell">
      <div className="auth-story">
        <BrandMark size={72} />
        <p className="kicker">Members desk</p>
        <h1>Bentornato.</h1>
        <p>Il terminal STATWIN è riservato. Analisi statistica, quattro livelli, nessuna promessa di vincita.</p>
      </div>
      <div className="auth card">
        <p className="kicker">Accesso</p>
        <h2 style={{ marginTop: 8 }}>Entra in piattaforma</h2>
        <p className="disclaimer">18+. Le probabilità sono stime modellistiche.</p>
        <form onSubmit={onSubmit}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required minLength={8} />
          {error ? <p className="disclaimer">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? 'Accesso...' : 'Entra in STATWIN'}
          </button>
        </form>
        <p className="muted">
          Non hai un account? <Link href="/register">Crea un profilo</Link>
        </p>
      </div>
    </div>
  );
}
