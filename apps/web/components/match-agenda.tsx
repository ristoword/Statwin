import { EmptyState } from './empty-state';
import { MatchCard } from './match-card';
import type { AgendaMatch } from '../lib/agenda';

export function MatchAgenda({
  recent,
  upcoming,
}: {
  recent: AgendaMatch[];
  upcoming: AgendaMatch[];
}) {
  if (recent.length === 0 && upcoming.length === 0) {
    return (
      <div className="card">
        <EmptyState
          title="Calendario vuoto"
          body="Quando il provider sincronizza gli incontri, ultime e prossime partite compariranno qui."
        />
      </div>
    );
  }

  return (
    <div className="grid-2 agenda">
      <section>
        <h2>Ultime partite</h2>
        {recent.length === 0 ? (
          <div className="card">
            <EmptyState title="Nessuna gara chiusa" body="I risultati appaiono solo se la fonte ha chiuso l’incontro." />
          </div>
        ) : (
          recent.map((match) => (
            <MatchCard
              key={match.id}
              href={`/matches/${match.id}`}
              home={match.homeTeam?.name}
              away={match.awayTeam?.name}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              status={match.status}
              estimate={match.estimate?.predictedScore}
              lines={[
                match.competition?.name ?? match.sport?.name ?? 'Evento',
                match.kickoff ? new Date(match.kickoff).toLocaleString('it-IT') : '',
              ].filter(Boolean)}
            />
          ))
        )}
      </section>
      <section>
        <h2>Prossime partite</h2>
        {upcoming.length === 0 ? (
          <div className="card">
            <EmptyState title="Nessuna gara in programma" body="Il calendario futuro arriverà dal provider, senza inventare date." />
          </div>
        ) : (
          upcoming.map((match) => (
            <MatchCard
              key={match.id}
              href={`/matches/${match.id}`}
              home={match.homeTeam?.name}
              away={match.awayTeam?.name}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              status={match.status}
              estimate={match.estimate?.predictedScore}
              lines={[
                match.competition?.name ?? match.sport?.name ?? 'Evento',
                match.kickoff ? new Date(match.kickoff).toLocaleString('it-IT') : '',
                match.estimate?.predictedScore
                  ? `Stima modello ${match.estimate.predictedScore.home}–${match.estimate.predictedScore.away}`
                  : '',
              ].filter(Boolean)}
            />
          ))
        )}
      </section>
    </div>
  );
}
