'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { clearTokens, getAccessToken } from '../../lib/auth-storage';

type Profile = {
  email: string;
  firstName?: string | null;
  role: string;
  subscription?: { plan: string; status: string } | null;
};

type FootballOverview = {
  sport?: { name: string; slug: string };
  counts?: { competitions: number; teams: number; matches: number };
  note?: string;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [football, setFootball] = useState<FootballOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      apiGet<Profile>('/users/me', token)
        .then(setProfile)
        .catch((err: Error) => setError(err.message));
    }
    apiGet<FootballOverview>('/football')
      .then(setFootball)
      .catch(() => setFootball({ note: 'API calcio non disponibile' }));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="disclaimer">Calcio è lo sport attivo. Le altre sezioni sono predisposte.</p>
      {error ? <p className="disclaimer">{error}</p> : null}
      <div className="card">
        {profile ? (
          <>
            <p>
              Ciao {profile.firstName || profile.email} — piano {profile.subscription?.plan ?? 'FREE'}
            </p>
            <button
              type="button"
              onClick={() => {
                clearTokens();
                setProfile(null);
              }}
            >
              Esci
            </button>
          </>
        ) : (
          <p>
            <Link href="/login">Accedi</Link> per il profilo e i piani.
          </p>
        )}
      </div>
      <div className="grid">
        <div className="card">
          <span className="badge">DATI</span>
          <h3>{football?.sport?.name ?? 'Calcio'}</h3>
          <p>
            Competizioni {football?.counts?.competitions ?? 0} · Squadre {football?.counts?.teams ?? 0} ·
            Partite {football?.counts?.matches ?? 0}
          </p>
          <Link href="/football">Apri calcio</Link>
        </div>
        <div className="card">
          <span className="badge">STATISTICHE</span>
          <p>Motore generico, indipendente dallo sport.</p>
          <Link href="/statistics">Apri</Link>
        </div>
        <div className="card">
          <span className="badge">PROBABILITÀ</span>
          <p>Stime modellistiche, non certezze.</p>
          <Link href="/predictions">Apri</Link>
        </div>
        <div className="card">
          <span className="badge">ANALISI AI</span>
          <p>Solo sui dati forniti.</p>
          <Link href="/ai-analysis">Apri</Link>
        </div>
      </div>
    </div>
  );
}
