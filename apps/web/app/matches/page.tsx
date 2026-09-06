import { apiGet } from '../../lib/api';
import { EmptyState } from '../../components/empty-state';
import { MatchCard } from '../../components/match-card';
import { PageHero } from '../../components/page-hero';

type Match = {
  id: string;
  kickoff?: string;
  status?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeam?: { name: string };
  awayTeam?: { name: string };
  competition?: { name: string };
};

export default async function MatchesPage() {
  let list: Match[] = [];
  try {
    const matches = await apiGet<Match[]>('/matches');
    list = Array.isArray(matches) ? matches : [];
  } catch {
    list = [];
  }

  return (
    <>
      <PageHero kicker="Calendario" title="Partite">
        <p>Ogni scheda apre i quattro livelli: DATI, STATISTICHE, PROBABILITÀ e ANALISI AI.</p>
      </PageHero>
      {list.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Nessuna partita in archivio"
            body="Quando il provider sincronizza un incontro, la scheda compare qui. Nessun risultato viene simulato."
          />
        </div>
      ) : (
        list.map((match) => (
          <MatchCard
            key={match.id}
            href={`/matches/${match.id}`}
            home={match.homeTeam?.name}
            away={match.awayTeam?.name}
            homeScore={match.homeScore}
            awayScore={match.awayScore}
            status={match.status}
            lines={[
              match.competition?.name ?? 'Calcio',
              match.kickoff ? new Date(match.kickoff).toLocaleString('it-IT') : '',
            ].filter(Boolean)}
          />
        ))
      )}
    </>
  );
}
