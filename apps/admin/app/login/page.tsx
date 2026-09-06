'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '../../lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const tokens = await apiPost<{ accessToken: string }>('/auth/login', {
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
      });
      localStorage.setItem('statwin.admin.token', tokens.accessToken);
      router.push('/');
    } catch {
      setError('Accesso non riuscito');
    }
  }

  return (
    <div className="card">
      <h1>Login admin</h1>
      <form onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="Email admin" required />
        <input name="password" type="password" required minLength={8} />
        {error ? <p>{error}</p> : null}
        <button type="submit">Entra</button>
      </form>
    </div>
  );
}
