import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { EmptyState } from '../../components/empty-state';
import { GenerateAiButton } from '../../components/generate-ai-button';
import { PageHero } from '../../components/page-hero';
import { PredictedResult } from '../../components/predicted-result';

type ReportList = {
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
    match?: { id: string; home: string; away: string; competition?: string | null; kickoff?: string };
  }>;
};

type Match = {
  id: string;
  kickoff?: string;
  homeTeam?: { name: string };
  awayTeam?: { name: string };
  competition?: { name: string };
};

export default async function AiAnalysisPage() {
  let reports: ReportList['items'] = [];
  let matches: Match[] = [];
  try {
    const payload = await apiGet<ReportList>('/ai/reports');
    reports = payload.items ?? [];
  } catch {
    reports = [];
  }
  try {
    const list = await apiGet<Match[] | { recent?: Match[]; upcoming?: Match[] }>('/matches');
    matches = Array.isArray(list) ? list : [...(list.upcoming ?? []), ...(list.recent ?? [])];
  } catch {
    matches = [];
  }

  return (
    <>
      <PageHero kicker="GPT-4o" title="Analisi AI">
        <p className="disclaimer">
          L’AI legge solo DATI, STATISTICHE e PROBABILITÀ già in archivio. Il risultato previsto è una stima di ANALISI
          AI, non un DATO ufficiale. 18+. Nessuna vincita promessa.
        </p>
      </PageHero>

      <h2>Report recenti</h2>
      {reports.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Nessun report salvato"
            body="Genera un’analisi da una partita già in archivio. Senza DATI l’AI non scrive."
          />
        </div>
      ) : (
        <div className="grid">
          {reports.map((report) => (
            <div className="card" key={report.id}>
              <span className="badge badge-ai">ANALISI AI</span>
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

      <h2>Partite in archivio</h2>
      {matches.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Archivio vuoto"
            body="Nessuna partita sincronizzata. Senza DATI l’AI non produce analisi."
          />
        </div>
      ) : (
        matches.map((match) => (
          <div className="card" key={match.id}>
            <span className="badge badge-data">DATI</span>
            <h3>
              <Link href={`/matches/${match.id}`}>
                {match.homeTeam?.name} vs {match.awayTeam?.name}
              </Link>
            </h3>
            <p className="muted">
              {match.competition?.name ?? 'Calcio'}
              {match.kickoff ? ` · ${new Date(match.kickoff).toLocaleString('it-IT')}` : ''}
            </p>
            <GenerateAiButton matchId={match.id} />
          </div>
        ))
      )}
    </>
  );
}
