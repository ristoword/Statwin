'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '../lib/api';
import { getAccessToken } from '../lib/auth-storage';

export function GenerateAiButton({
  matchId,
  force = false,
  label = 'Genera analisi AI',
}: {
  matchId: string;
  force?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    const token = getAccessToken();
    if (!token) {
      router.push('/login?next=/ai-analysis');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await apiPost('/ai/analyze', { matchId, force }, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analisi non riuscita');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn" type="button" onClick={run} disabled={busy}>
        {busy ? 'Analisi in corso…' : label}
      </button>
      {error ? <p className="disclaimer">{error}</p> : null}
    </div>
  );
}
