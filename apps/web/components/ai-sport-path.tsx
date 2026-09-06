import Link from 'next/link';
import { EmptyState } from './empty-state';
import { GenerateAiButton } from './generate-ai-button';

export type AiPathMatch = {
  id: string;
  homeTeam?: { name: string };
  awayTeam?: { name: string };
  competition?: { name: string } | null;
  kickoff?: string;
};

export function AiSportPath({
  sportSlug,
  sportName,
  eventNoun,
  matches,
}: {
  sportSlug: string;
  sportName: string;
  eventNoun: string;
  matches: AiPathMatch[];
}) {
  return (
    <section>
      <h2>ANALISI AI · {sportName}</h2>
      <p className="disclaimer">
        L’AI legge tutti gli sport in archivio. Commenta solo DATI, STATISTICHE e PROBABILITÀ già
        presenti. Piano PRO. 18+. Nessuna vincita promessa.
      </p>
      {matches.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Senza DATI l’AI non scrive"
            body={`Nessun ${eventNoun} in archivio per ${sportName}. STATWIN non inventa punteggi. Quando arriverà una fonte, l’analisi AI userà solo quella scheda.`}
          />
          <p>
            <Link className="btn-ghost" href="/ai-analysis">
              Vai alle analisi AI
            </Link>
          </p>
        </div>
      ) : (
        <>
          {matches.slice(0, 5).map((match) => (
            <div className="card" key={match.id}>
              <span className="badge badge-ai">ANALISI AI</span>
              <h3>
                <Link href={`/matches/${match.id}`}>
                  {match.homeTeam?.name ?? 'Casa'} vs {match.awayTeam?.name ?? 'Trasferta'}
                </Link>
              </h3>
              <p className="muted">
                {match.competition?.name ?? sportName}
                {match.kickoff ? ` · ${new Date(match.kickoff).toLocaleString('it-IT')}` : ''}
              </p>
              <GenerateAiButton matchId={match.id} sport={sportSlug} />
            </div>
          ))}
          <p>
            <Link className="btn-ghost" href="/ai-analysis">
              Tutti gli sport in archivio
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
