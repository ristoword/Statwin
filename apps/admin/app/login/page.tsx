'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '../../lib/api';
import { ADMIN_TOKEN_KEY } from '../../lib/session';

function readJwtRole(accessToken: string): string | undefined {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1] ?? '')) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : undefined;
  } catch {
    return undefined;
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const tokens = await apiPost<{ accessToken: string; role?: string }>('/auth/login', {
        email: String(form.get('email') ?? '').trim().toLowerCase(),
        password: String(form.get('password') ?? ''),
      });
      const role = tokens.role ?? readJwtRole(tokens.accessToken);
      if (role !== 'ADMIN') {
        setError(
          'Questo account non è un amministratore. Accedi dalla web app (porta 3000), non dalla control room.',
        );
        return;
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, tokens.accessToken);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accesso non riuscito. Solo account ADMIN attivi.');
    }
  }

  return (
    <div className="card">
      <h1>Login admin</h1>
      <p className="lede">Control room account. JWT + ruolo ADMIN. 18+.</p>
      <form onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="Email admin" required />
        <input name="password" type="password" required minLength={8} />
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Entra</button>
      </form>
    </div>
  );
}
