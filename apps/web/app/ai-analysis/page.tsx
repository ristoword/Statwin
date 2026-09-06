import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { getServerAccessToken } from '../../lib/server-auth';
import { EmptyState } from '../../components/empty-state';
import { GenerateAiButton } from '../../components/generate-ai-button';
import { PageHero } from '../../components/page-hero';
import { PlanLock } from '../../components/plan-lock';
import { PredictedResult } from '../../components/predicted-result';

type ReportList = {
  locked?: boolean;
  items?: Array<{
    id: string;
    createdAt: string;
    content?: {
      analysis?: string;
      predictedResult?: {
        outcome?: string;
        scoreHome?: number;
        scoreAway?: number;
        confidence?: string;
        rationale?: string | null;
      } | null;
    };
    match?: {
      id: string;
      home: string;
      away: string;
      competition?: string | null;
      kickoff?: string;
      sport?: { slug: string; name: string } | null;
    };
  }>;
};

type ArchiveSport = {
  slug: string;
  name: string;
  href: string;
  eventNoun: string;
  status: string;
  count: number;
  items: Array<{
    id: string;
    kickoff?: string;
    homeTeam?: { name: string };
    awayTeam?: { name: string };
    competition?: { name: string } | null;
    sport?: { slug: string; name: string };
  }>;
};

type ArchivePayload = {
  note?: string;
  sports?: ArchiveSport[];
};

export default async function AiAnalysisPage() {
  let reports: ReportList['items'] = [];
  let archive: ArchiveSport[] = [];
  let locked = false;
  try {
    const token = await getServerAccessToken();
    const payload = await apiGet<ReportList>('/ai/reports', token);
    locked = Boolean(payload.locked);
    reports = payload.items ?? [];
  } catch {
    reports = [];
  }
  try {
    const payload = await apiGet<ArchivePayload>('/ai/archive');
    archive = payload.sports ?? [];
  } catch {
    archive = [];
  }

  return (
    <>
      <PageHero kicker="GPT-4o · tutti gli sport" title="Analisi AI">
        <p className="disclaimer">
          L’AI legge tutti gli sport in archivio. Commenta solo DATI, STATISTICHE e PROBABILITÀ già
          presenti. Il risultato previsto è una stima di ANALISI AI, non un DATO ufficiale. 18+.
          Nessuna vincita promessa.
        </p>
      </PageHero>

      {locked ? (
        <PlanLock
          required="PRO"
          title="Analisi AI riservata a Pro"
          body="Il piano Pro sblocca i report ANALISI AI e la lettura completa a quattro livelli."
        />
      ) : null}

      <h2>Report recenti</h2>
      {locked ? null : reports.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Nessun report salvato"
            body="Genera un’analisi da un evento già in archivio, in qualsiasi sport. Senza DATI l’AI non scrive."
          />
        </div>
      ) : (
        <div className="grid">
          {reports.map((report) => (
            <div className="card" key={report.id}>
              <span className="badge badge-ai">ANALISI AI</span>
              <p className="muted">{report.match?.sport?.name ?? report.match?.competition ?? 'Archivio'}</p>
              <h3>
                <Link href={`/matches/${report.match?.id}`}>
                  {report.match?.home} vs {report.match?.away}
                </Link>
              </h3>
              <p>{report.content?.analysis ?? 'Sintesi non disponibile.'}</p>
              <PredictedResult
                variant="ai"
                title="Risultato previsto · AI"
                home={report.match?.home}
                away={report.match?.away}
                prediction={
                  report.content?.predictedResult
                    ? {
                        home: report.content.predictedResult.scoreHome,
                        away: report.content.predictedResult.scoreAway,
                        outcome: report.content.predictedResult.outcome,
                        confidence: report.content.predictedResult.confidence,
                        rationale: report.content.predictedResult.rationale,
                      }
                    : null
                }
              />
              <p className="muted">{new Date(report.createdAt).toLocaleString('it-IT')}</p>
            </div>
          ))}
        </div>
      )}

      <h2>Archivio per sport</h2>
      {archive.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Archivio vuoto"
            body="Nessun evento sincronizzato. Senza DATI l’AI non produce analisi e non inventa punteggi."
          />
        </div>
      ) : (
        archive.map((sport) => (
          <section key={sport.slug}>
            <h3>
              <Link href={sport.href}>{sport.name}</Link>
              <span className="muted"> · {sport.count} {sport.eventNoun}</span>
            </h3>
            {sport.items.length === 0 ? (
              <div className="card">
                <EmptyState
                  title={`Senza DATI l’AI non scrive`}
                  body={`Nessun ${sport.eventNoun} in archivio per ${sport.name}. STATWIN non inventa risultati.`}
                />
                <p>
                  <Link className="btn-ghost" href={sport.href}>
                    Apri il desk {sport.name}
                  </Link>
                </p>
              </div>
            ) : (
              sport.items.map((match) => (
                <div className="card" key={match.id}>
                  <span className="badge badge-data">DATI</span>
                  <h3>
                    <Link href={`/matches/${match.id}`}>
                      {match.homeTeam?.name} vs {match.awayTeam?.name}
                    </Link>
                  </h3>
                  <p className="muted">
                    {match.competition?.name ?? sport.name}
                    {match.kickoff ? ` · ${new Date(match.kickoff).toLocaleString('it-IT')}` : ''}
                  </p>
                  {locked ? (
                    <p className="muted">Generazione riservata al piano Pro.</p>
                  ) : (
                    <GenerateAiButton matchId={match.id} sport={sport.slug} />
                  )}
                </div>
              ))
            )}
          </section>
        ))
      )}
    </>
  );
}
