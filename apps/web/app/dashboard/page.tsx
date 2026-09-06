'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { clearTokens, getAccessToken } from '../../lib/auth-storage';
import { AccountForm, type AccountProfile } from '../../components/account-form';
import { SportsGrid } from '../../components/sports-grid';
import { trialUntilLabel } from '../../lib/trial';

type Profile = AccountProfile;

type FootballOverview = {
  sport?: { name: string; slug: string };
  counts?: { competitions: number; teams: number; matches: number };
  note?: string;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [football, setFootball] = useState<FootballOverview | null>(null);
  const [error, setError] = useState('');

  const onAccountProfile = useCallback((data: Profile) => {
    setProfile(data);
  }, []);

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

  const trialLabel = trialUntilLabel(
    profile?.trialEndsAt ?? profile?.subscription?.trialEndsAt,
    profile?.subscription?.plan,
  );

  return (
    <>
      <p className="kicker">Control room</p>
      <h1>Il tuo desk.</h1>
      <p className="disclaimer">
        Desk multi-sport. Calcio e basket possono avere dati sincronizzati; gli altri moduli restano
        predisposti, senza risultati inventati. 18+.
      </p>
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
                Piano <strong>{profile.subscription?.plan ?? 'FREE'}</strong>
                {trialLabel ? ` · ${trialLabel}` : null} · {profile.role}
              </p>
              {profile.phone ? <p className="muted">Tel. {profile.phone}</p> : null}
              <p>
                <Link className="btn-ghost" href="/settings#account">
                  Account
                </Link>{' '}
                <Link className="btn-ghost" href="/subscriptions">
                  Gestisci piano
                </Link>
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

      {profile ? (
        <div className="card" id="account">
          <p className="kicker">Account</p>
          <h2>Email, telefono e password</h2>
          <p className="disclaimer">
            Cambia i dati del desk. Per l’email serve la password attuale. 18+.
          </p>
          <AccountForm onProfile={onAccountProfile} />
        </div>
      ) : null}

      {profile?.role === 'ADMIN' ? (
        <div className="card">
          <span className="badge badge-ai">ADMIN</span>
          <h3>Account / Control room</h3>
          <p>
            Sala operativa account: crea PRO, blocca utenti, accessi e password. Il CRUD resta
            sull’admin, non su questa dashboard pubblica.
          </p>
          <p>
            <a
              className="btn"
              href={process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3002'}
              target="_blank"
              rel="noreferrer"
            >
              Apri control room
            </a>
          </p>
        </div>
      ) : null}

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
          <p>L’AI legge tutti gli sport in archivio. Commenta solo ciò che è già presente.</p>
        </Link>
      </div>

      <h2>Sport</h2>
      <SportsGrid compact />
    </>
  );
}
