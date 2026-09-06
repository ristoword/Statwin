import Link from 'next/link';
import { apiGet } from '../../lib/api';

type FootballOverview = {
  sport?: { name: string };
  counts?: { competitions: number; teams: number; matches: number };
  note?: string;
};

type Competition = {
  id: string;
  name: string;
  country?: string | null;
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

const ITALY_ORDER = ['Serie A', 'Serie B', 'Serie C Girone C'];

function sortCompetitions(items: Competition[]): Competition[] {
  return [...items].sort((a, b) => {
    const ai = ITALY_ORDER.indexOf(a.name);
    const bi = ITALY_ORDER.indexOf(b.name);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.name.localeCompare(b.name, 'it');
  });
}

async function load(competitionId?: string) {
  try {
    const [overview, rawCompetitions] = await Promise.all([
      apiGet<FootballOverview>('/football'),
      apiGet<Competition[]>('/football/competitions'),
    ]);
    const competitions = Array.isArray(rawCompetitions) ? sortCompetitions(rawCompetitions) : [];
    const selectedId =
      competitionId ?? competitions.find((item) => item.name.startsWith('Serie A'))?.id ?? competitions[0]?.id;
    const query = selectedId ? `?competitionId=${selectedId}` : '';
    const [matches, standings] = await Promise.all([
      apiGet<Match[]>(`/football/matches${query}`),
      apiGet<Standing[]>(`/football/standings${query}`),
    ]);
    return {
      overview,
      competitions,
      selectedId,
      matches: Array.isArray(matches) ? matches : [],
      standings: Array.isArray(standings) ? standings : [],
    };
  } catch {
    return {
      overview: { note: 'API non raggiungibile o database non ancora avviato.', counts: { competitions: 0, teams: 0, matches: 0 } },
      competitions: [],
      selectedId: undefined,
      matches: [],
      standings: [],
    };
  }
}

export default async function FootballPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const { overview, competitions, selectedId, matches, standings } = await load(c);
  const selected = competitions.find((item) => item.id === selectedId);

  return (
    <div>
      <h1>Calcio</h1>
      <p className="disclaimer">
        Campionati italiani da TheSportsDB (Serie A, B, C). Nessun risultato inventato: i punteggi ci sono solo se la fonte li ha chiusi.
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
      {competitions.length > 0 ? (
        <div className="card">
          {competitions.map((competition) => (
            <Link
              key={competition.id}
              href={`/football?c=${competition.id}`}
              className="badge"
            >
              {competition.name}
              {selectedId === competition.id ? ' ✓' : ''}
            </Link>
          ))}
        </div>
      ) : null}
      {selected ? <h2>{selected.name}</h2> : null}
      {standings.length > 0 ? (
        <>
          <h3>Classifica</h3>
          <div className="card">
            <span className="badge">DATI</span>
            {standings.map((row) => (
              <p key={`${row.position}-${row.team.name}`}>
                {row.position}. {row.team.name} — {row.points} pt ({row.played} gare)
              </p>
            ))}
          </div>
        </>
      ) : (
        <div className="card">Classifica non ancora disponibile per questo campionato.</div>
      )}
      <h3>Partite</h3>
      {matches.length === 0 ? (
        <div className="card">Nessuna partita sincronizzata per questo campionato.</div>
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
