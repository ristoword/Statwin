'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '../lib/api';
import { getAccessToken } from '../lib/auth-storage';

type CheckoutResult = {
  url?: string;
  activated?: boolean;
  plan?: string;
};

export function SubscribeButton({
  plan,
  label,
  current,
}: {
  plan: 'PREMIUM' | 'PRO';
  label: string;
  current?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rank: Record<string, number> = { FREE: 0, PREMIUM: 1, PRO: 2 };
  const already = (rank[current ?? 'FREE'] ?? 0) >= (rank[plan] ?? 0);

  async function subscribe() {
    const token = getAccessToken();
    if (!token) {
      router.push('/login?next=/subscriptions');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const origin = window.location.origin;
      const result = await apiPost<CheckoutResult>(
        '/payments/checkout',
        {
          plan,
          successUrl: `${origin}/dashboard?upgraded=1`,
          cancelUrl: `${origin}/subscriptions`,
        },
        token,
      );
      if (result.activated) {
        router.push('/dashboard?upgraded=1');
        router.refresh();
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Attivazione non riuscita');
    } finally {
      setBusy(false);
    }
  }

  if (already) {
    return <p className="muted">Piano già incluso nel tuo account.</p>;
  }

  return (
    <div>
      <button className="btn" type="button" onClick={subscribe} disabled={busy}>
        {busy ? 'Attivazione…' : label}
      </button>
      {error ? <p className="disclaimer">{error}</p> : null}
    </div>
  );
}
