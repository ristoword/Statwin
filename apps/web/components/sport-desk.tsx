import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiGet } from '../lib/api';
import { asAgenda, type AgendaMatch } from '../lib/agenda';
import { findSport } from '../lib/sports-catalog';
import { AiSportPath } from './ai-sport-path';
import { EmptyState } from './empty-state';
import { MatchAgenda } from './match-agenda';
import { PageHero } from './page-hero';

type SportOverview = {
  counts?: { competitions: number; teams: number; matches: number };
  note?: string;
};

export async function SportDesk({ slug }: { slug: string }) {
  const sport = findSport(slug);
  if (!sport) notFound();

  let overview: SportOverview = { counts: { competitions: 0, teams: 0, matches: 0 } };
  let events: { recent: AgendaMatch[]; upcoming: AgendaMatch[] } = { recent: [], upcoming: [] };
  try {
    overview = await apiGet<SportOverview>(`/${sport.apiPath}`);
  } catch {
    overview = {
      counts: { competitions: 0, teams: 0, matches: 0 },
      note: 'API non raggiungibile. Nessun risultato viene inventato.',
    };
  }
  try {
    events = asAgenda(await apiGet(`/${sport.apiPath}/events`));
  } catch {
    events = { recent: [], upcoming: [] };
  }

  const counts = overview.counts ?? { competitions: 0, teams: 0, matches: 0 };
  const archived = [...events.upcoming, ...events.recent];

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

      {archived.length > 0 ? (
        <MatchAgenda recent={events.recent} upcoming={events.upcoming} />
      ) : (
        <div className="card coming-panel">
          <EmptyState
            title={`${sport.name}: archivio vuoto`}
            body={
              overview.note ??
              'Quando una fonte ufficiale sara collegata, compariranno solo DATI verificati. STATISTICHE, PROBABILITA e ANALISI AI nasceranno da quelli. Finche allora l\'archivio resta vuoto.'
            }
          />
        </div>
      )}

      <AiSportPath
        sportSlug={sport.slug}
        sportName={sport.name}
        eventNoun={sport.eventNoun}
        matches={archived}
      />

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
          <p>L’AI legge tutti gli sport in archivio. Senza DATI non scrive. Piano PRO.</p>
        </Link>
      </div>
    </>
  );
}
