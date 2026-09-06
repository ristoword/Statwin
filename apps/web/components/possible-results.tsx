import type { AgendaMatch } from '../lib/agenda';
import { EmptyState } from './empty-state';
import { MarketBoard } from './market-board';
import { PlanLock } from './plan-lock';
import { PredictedResult } from './predicted-result';

export function PossibleResults({
  upcoming,
  locked,
}: {
  upcoming: AgendaMatch[];
  locked: boolean;
}) {
  const withEstimates = upcoming.filter((match) => match.estimate);

  return (
    <section className="possible-results">
      <h2>Risultati possibili</h2>
      <p className="disclaimer">
        Stime del modello (punteggio previsto, 1X2, over/under). Non sono punteggi ufficiali e non
        promettono vincite. Piano PREMIUM. 18+.
      </p>
      {locked ? (
        <PlanLock
          required="PREMIUM"
          title="Probabilità riservate a Premium"
          body="Il piano Free mostra classifiche e partite. Le stime 1X2 e over/under si sbloccano da Premium."
        />
      ) : withEstimates.length > 0 ? (
        withEstimates.slice(0, 5).map((match) => (
          <div className="card" key={match.id}>
            <span className="badge badge-prob">PROBABILITÀ</span>
            <h3>
              {match.homeTeam?.name ?? 'Casa'} vs {match.awayTeam?.name ?? 'Trasferta'}
            </h3>
            <p className="muted">
              {match.competition?.name ?? 'Evento'}
              {match.kickoff ? ` · ${new Date(match.kickoff).toLocaleString('it-IT')}` : ''}
            </p>
            <PredictedResult
              variant="prob"
              title="Punteggio previsto · modello"
              home={match.homeTeam?.name}
              away={match.awayTeam?.name}
              prediction={match.estimate?.predictedScore}
            />
            <MarketBoard
              outcomes={match.estimate?.outcomes}
              overUnder={match.estimate?.overUnder}
              btts={match.estimate?.btts}
              disclaimer={match.estimate?.impliedOddsDisclaimer}
            />
          </div>
        ))
      ) : (
        <div className="card">
          <EmptyState
            title="Nessuna stima disponibile"
            body="Le probabilità nascono dalla classifica già in archivio. Senza tabella ufficiale non viene inventato un 1X2."
          />
        </div>
      )}
    </section>
  );
}
