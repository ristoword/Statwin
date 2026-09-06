import Link from 'next/link';
import { apiGet } from '../../lib/api';

type Match = {
  id: string;
  homeTeam?: { name: string };
  awayTeam?: { name: string };
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
    <div>
      <h1>Partite</h1>
      {list.length === 0 ? (
        <div className="card">Nessuna partita sincronizzata. I provider verranno collegati in una fase successiva.</div>
      ) : (
        list.map((match) => (
          <Link key={match.id} href={`/matches/${match.id}`} className="card">
            {match.homeTeam?.name} vs {match.awayTeam?.name}
          </Link>
        ))
      )}
    </div>
  );
}
