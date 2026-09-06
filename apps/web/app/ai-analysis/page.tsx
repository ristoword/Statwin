import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { GenerateAiButton } from '../../components/generate-ai-button';

type ReportList = {
  items?: Array<{
    id: string;
    createdAt: string;
    content?: { analysis?: string };
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
    const list = await apiGet<Match[]>('/matches');
    matches = Array.isArray(list) ? list : [];
  } catch {
    matches = [];
  }

  return (
    <div>
      <span className="badge">ANALISI AI</span>
      <h1>Analisi AI</h1>
      <p className="disclaimer">
        L’AI legge solo DATI, STATISTICHE e PROBABILITÀ già in archivio. Non inventa risultati e non promette vincite.
        18+.
      </p>

      <h2>Report recenti</h2>
      {reports.length === 0 ? (
        <div className="card">Nessun report AI salvato. Generane uno da una partita in archivio.</div>
      ) : (
        reports.map((report) => (
          <div className="card" key={report.id}>
            <span className="badge">ANALISI AI</span>
            <h3>
              <Link href={`/matches/${report.match?.id}`}>{report.match?.home} vs {report.match?.away}</Link>
            </h3>
            <p>{report.content?.analysis ?? 'Sintesi non disponibile.'}</p>
            <small>{new Date(report.createdAt).toLocaleString('it-IT')}</small>
          </div>
        ))
      )}

      <h2>Partite in archivio</h2>
      {matches.length === 0 ? (
        <div className="card">Nessuna partita sincronizzata. Senza DATI l’AI non produce analisi.</div>
      ) : (
        matches.map((match) => (
          <div className="card" key={match.id}>
            <span className="badge">DATI</span>
            <h3>
              <Link href={`/matches/${match.id}`}>
                {match.homeTeam?.name} vs {match.awayTeam?.name}
              </Link>
            </h3>
            <p>
              {match.competition?.name ?? 'Calcio'}
              {match.kickoff ? ` · ${new Date(match.kickoff).toLocaleString('it-IT')}` : ''}
            </p>
            <GenerateAiButton matchId={match.id} />
          </div>
        ))
      )}
    </div>
  );
}
