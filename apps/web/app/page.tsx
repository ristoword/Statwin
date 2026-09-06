import Image from 'next/image';
import Link from 'next/link';
import { apiV1, apiGet } from '../lib/api';
import { asAgenda } from '../lib/agenda';
import { MatchAgenda } from '../components/match-agenda';

type FootballOverview = {
  counts?: { competitions: number; teams: number; matches: number };
};

async function getHealth() {
  try {
    const res = await fetch(`${apiV1()}/health`, { cache: 'no-store' });
    return res.json();
  } catch {
    return { status: 'offline' };
  }
}

async function getFootball() {
  try {
    return await apiGet<FootballOverview>('/football');
  } catch {
    return { counts: { competitions: 0, teams: 0, matches: 0 } };
  }
}

async function getMatches() {
  try {
    return asAgenda(await apiGet('/matches'));
  } catch {
    return { recent: [], upcoming: [] };
  }
}

export default async function Home() {
  const [health, football, agenda] = await Promise.all([getHealth(), getFootball(), getMatches()]);
  const live = health.status === 'ok';

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">Sports intelligence platform</p>
          <h1>
            La lettura dei dati,
            <br />
            non la promessa del risultato.
          </h1>
          <p>
            STATWIN è un terminal di analisi sportiva. Separa in modo visivo e tecnico DATI,
            STATISTICHE, PROBABILITÀ e ANALISI AI. Il primo sport attivo è il calcio italiano.
          </p>
          <div className="hero-actions">
            <Link className="btn" href="/football">
              Entra nel calcio
            </Link>
            <Link className="btn-ghost" href="/subscriptions">
              Vedi i piani
            </Link>
          </div>
          <div className="hero-meta">
            <span className={`pulse${live ? '' : ' off'}`}>
              <i />
              Sistema {live ? 'operativo' : health.status ?? 'offline'}
            </span>
            <span>
              <b>{football.counts?.competitions ?? 0}</b> campionati
            </span>
            <span>
              <b>{football.counts?.matches ?? 0}</b> partite in archivio
            </span>
            <span>18+ · nessuna vincita promessa</span>
          </div>
        </div>
        <div className="hero-emblem">
          <Image src="/logo.png" alt="STATWIN — intelligenza artificiale e analisi" width={280} height={280} priority />
        </div>
      </section>

      <h2>Quattro livelli. Mai mescolati.</h2>
      <div className="grid-4 pipeline">
        <Link className="card pipeline-card" href="/football">
          <span className="layer-index">01</span>
          <span className="badge badge-data">DATI</span>
          <h3>Fonte ufficiale</h3>
          <p>Punteggi e classifiche solo se il provider ha chiuso la gara. Nulla viene inventato.</p>
        </Link>
        <Link className="card pipeline-card" href="/statistics">
          <span className="layer-index">02</span>
          <span className="badge badge-stats">STATISTICHE</span>
          <h3>Calcolo pulito</h3>
          <p>Win rate, forma e medie nate esclusivamente dai dati già in archivio.</p>
        </Link>
        <Link className="card pipeline-card" href="/predictions">
          <span className="layer-index">03</span>
          <span className="badge badge-prob">PROBABILITÀ</span>
          <h3>Modelli, non oracoli</h3>
          <p>Stime sostituibili. Non sono consigli di scommessa e non sono certezze.</p>
        </Link>
        <Link className="card pipeline-card" href="/ai-analysis">
          <span className="layer-index">04</span>
          <span className="badge badge-ai">ANALISI AI</span>
          <h3>Lettura GPT-4o</h3>
          <p>L’intelligenza commenta solo ciò che è già nel database. Mai un risultato fantasma.</p>
        </Link>
      </div>

      <h2>Ultime e prossime</h2>
      <MatchAgenda recent={agenda.recent} upcoming={agenda.upcoming} />

      <h2>Sport</h2>
      <div className="grid">
        <Link className="card" href="/football">
          <span className="badge badge-data">LIVE</span>
          <h3>Calcio</h3>
          <p>Serie A, B e C. Classifiche, calendari e schede partita a quattro livelli.</p>
        </Link>
        <Link className="card coming" href="/basketball">
          <span className="badge">PREDISPOSTO</span>
          <h3>Basket</h3>
          <p>Modulo pronto. Nessun dato finché non arriva il provider.</p>
        </Link>
        <Link className="card coming" href="/tennis">
          <span className="badge">PREDISPOSTO</span>
          <h3>Tennis</h3>
          <p>Stessa architettura, stesso rigoroso rispetto delle fonti.</p>
        </Link>
        <Link className="card coming" href="/volleyball">
          <span className="badge">PREDISPOSTO</span>
          <h3>Pallavolo</h3>
          <p>In attesa di integrazione. L’AI non riempie i vuoti.</p>
        </Link>
      </div>

      <section className="cta-band">
        <p className="kicker">Accesso riservato</p>
        <h2 style={{ marginTop: 8 }}>Un desk di analisi, non un bookmaker.</h2>
        <p>Crea un profilo per dashboard, report salvati e i tre piani di lettura.</p>
        <div className="hero-actions">
          <Link className="btn" href="/register">
            Apri il profilo
          </Link>
          <Link className="btn-ghost" href="/legal">
            Leggi le informative
          </Link>
        </div>
      </section>
    </>
  );
}
