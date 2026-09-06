import Link from 'next/link';
import { apiGet } from '../../lib/api';

type FootballOverview = {
  sport?: { name: string };
  counts?: { competitions: number; teams: number; matches: number };
  note?: string;
};

type Match = {
  id: string;
  kickoff: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam?: { name: string };
  awayTeam?: { name: string };
};

type Standing = {
  position: number;
  played: number;
  points: number;
  team: { name: string };
};

async function load() {
  try {
    const [overview, matches, standings] = await Promise.all([
      apiGet<FootballOverview>('/football'),
      apiGet<Match[]>('/football/matches'),
      apiGet<Standing[]>('/football/standings'),
    ]);
    return {
      overview,
      matches: Array.isArray(matches) ? matches : [],
      standings: Array.isArray(standings) ? standings : [],
    };
  } catch {
    return {
      overview: { note: 'API non raggiungibile o database non ancora avviato.' },
      matches: [],
      standings: [],
    };
  }
}

export default async function FootballPage() {
  const { overview, matches, standings } = await load();
  return (
    <div>
      <h1>Calcio</h1>
      <p className="disclaimer">
        Dati da OpenLigaDB (Bundesliga). Nessun risultato inventato: i punteggi ci sono solo se la fonte li ha chiusi.
      </p>
      <div className="grid">
        <div className="card">
          <span className="badge">DATI</span>
          <h3>Competizioni</h3>
          <p>{overview.counts?.competitions ?? 0}</p>
        </div>
        <div className="card">
          <span className="badge">DATI</span>
          <h3>Squadre</h3>
          <p>{overview.counts?.teams ?? 0}</p>
        </div>
        <div className="card">
          <span className="badge">DATI</span>
          <h3>Partite</h3>
          <p>{overview.counts?.matches ?? 0}</p>
        </div>
      </div>
      {standings.length > 0 ? (
        <>
          <h2>Classifica</h2>
          <div className="card">
            <span className="badge">DATI</span>
            {standings.map((row) => (
              <p key={`${row.position}-${row.team.name}`}>
                {row.position}. {row.team.name} — {row.points} pt ({row.played} gare)
              </p>
            ))}
          </div>
        </>
      ) : null}
      <h2>Partite</h2>
      {matches.length === 0 ? (
        <div className="card">Nessuna partita sincronizzata. Avvia POST /api/v1/football/sync</div>
      ) : (
        matches.map((match) => (
          <Link key={match.id} href={`/matches/${match.id}`} className="card">
            <span className="badge">{match.status}</span>
            {match.homeTeam?.name} {match.homeScore ?? '-'} : {match.awayScore ?? '-'} {match.awayTeam?.name}
            <br />
            <small>{new Date(match.kickoff).toLocaleString('it-IT')}</small>
          </Link>
        ))
      )}
    </div>
  );
}
