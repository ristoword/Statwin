import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiGet } from '../lib/api';
import { findSport } from '../lib/sports-catalog';
import { EmptyState } from './empty-state';
import { PageHero } from './page-hero';

type SportOverview = {
  counts?: { competitions: number; teams: number; matches: number };
  note?: string;
};

export async function SportDesk({ slug }: { slug: string }) {
  const sport = findSport(slug);
  if (!sport) notFound();

  let overview: SportOverview = { counts: { competitions: 0, teams: 0, matches: 0 } };
  try {
    overview = await apiGet<SportOverview>(`/${sport.apiPath}`);
  } catch {
    overview = {
      counts: { competitions: 0, teams: 0, matches: 0 },
      note: 'API non raggiungibile. Nessun risultato viene inventato.',
    };
  }

  const counts = overview.counts ?? { competitions: 0, teams: 0, matches: 0 };

  return (
    <>
      <PageHero kicker={`${sport.focus} · Desk analitico`} title={sport.name}>
        <p className="disclaimer">
          18+. STATWIN e analisi sportiva, non un bookmaker. Nessuna vincita promessa. Nessun
          risultato inventato.
        </p>
        <p>{sport.blurb}</p>
      </PageHero>

      <div className="grid">
        <div className="card stat">
          <span>Competizioni</span>
          <strong>{counts.competitions}</strong>
        </div>
        <div className="card stat">
          <span>Squadre / atleti</span>
          <strong>{counts.teams}</strong>
        </div>
        <div className="card stat">
          <span>{sport.eventNoun}</span>
          <strong>{counts.matches}</strong>
        </div>
      </div>

      <div className="card coming-panel">
        <EmptyState
          title={`${sport.name}: archivio vuoto`}
          body={
            overview.note ??
            'Quando una fonte ufficiale sara collegata, compariranno solo DATI verificati. STATISTICHE, PROBABILITA e ANALISI AI nasceranno da quelli. Finche allora l\'archivio resta vuoto.'
          }
        />
      </div>

      <div className="grid-4 pipeline">
        <div className="card pipeline-card">
          <span className="badge badge-data">DATI</span>
          <h3>Fonte</h3>
          <p>Nessun punteggio, quota o classifica viene creato a tavolino.</p>
        </div>
        <Link className="card pipeline-card" href="/statistics">
          <span className="badge badge-stats">STATISTICHE</span>
          <h3>Calcolo</h3>
          <p>Solo sui dati gia in archivio. Piano FREE.</p>
        </Link>
        <Link className="card pipeline-card" href="/predictions">
          <span className="badge badge-prob">PROBABILITA</span>
          <h3>Stime</h3>
          <p>Modelli, non oracoli. Piano PREMIUM.</p>
        </Link>
        <Link className="card pipeline-card" href="/ai-analysis">
          <span className="badge badge-ai">ANALISI AI</span>
          <h3>Lettura</h3>
          <p>Commenta solo cio che e gia nel database. Piano PRO.</p>
        </Link>
      </div>
    </>
  );
}
