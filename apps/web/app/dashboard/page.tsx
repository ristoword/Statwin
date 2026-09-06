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
    <>
      <p className="kicker">Control room</p>
      <h1>Il tuo desk.</h1>
      <p className="disclaimer">Calcio attivo. Gli altri sport sono moduli predisposti, senza dati inventati.</p>
      {error ? <p className="disclaimer">{error}</p> : null}

      <div className="card">
        {profile ? (
          <div className="grid-2">
            <div>
              <p className="muted">Profilo</p>
              <h3>
                {profile.firstName || profile.email}
              </h3>
              <p>
                Piano <strong>{profile.subscription?.plan ?? 'FREE'}</strong> · {profile.role}
              </p>
            </div>
            <div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  clearTokens();
                  setProfile(null);
                }}
              >
                Esci
              </button>
            </div>
          </div>
        ) : (
          <p>
            <Link className="btn" href="/login">Accedi</Link> per profilo, piani e report salvati.
          </p>
        )}
      </div>

      <div className="grid">
        <div className="card stat">
          <span className="badge badge-data">DATI</span>
          <span>Competizioni</span>
          <strong>{football?.counts?.competitions ?? 0}</strong>
        </div>
        <div className="card stat">
          <span className="badge badge-data">DATI</span>
          <span>Squadre</span>
          <strong>{football?.counts?.teams ?? 0}</strong>
        </div>
        <div className="card stat">
          <span className="badge badge-data">DATI</span>
          <span>Partite</span>
          <strong>{football?.counts?.matches ?? 0}</strong>
        </div>
      </div>

      <div className="grid">
        <Link className="card" href="/football">
          <span className="badge badge-data">DATI</span>
          <h3>{football?.sport?.name ?? 'Calcio'}</h3>
          <p>Classifiche e calendari dai provider collegati.</p>
        </Link>
        <Link className="card" href="/statistics">
          <span className="badge badge-stats">STATISTICHE</span>
          <h3>Motore generico</h3>
          <p>Indipendente dallo sport, calcolato sui dati esistenti.</p>
        </Link>
        <Link className="card" href="/predictions">
          <span className="badge badge-prob">PROBABILITÀ</span>
          <h3>Stime modellistiche</h3>
          <p>Non sono certezze e non sono consigli di scommessa.</p>
        </Link>
        <Link className="card" href="/ai-analysis">
          <span className="badge badge-ai">ANALISI AI</span>
          <h3>Lettura GPT-4o</h3>
          <p>Commenta solo ciò che è già in archivio.</p>
        </Link>
      </div>
    </>
  );
}
