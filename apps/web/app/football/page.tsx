import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { EmptyState } from '../../components/empty-state';
import { MatchAgenda } from '../../components/match-agenda';
import { PageHero } from '../../components/page-hero';
import { asAgenda, type AgendaMatch } from '../../lib/agenda';

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


type Standing = {
  position: number;
  played: number;
  points: number;
  won?: number;
  drawn?: number;
  lost?: number;
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
      apiGet<unknown>(`/football/matches${query}`),
      apiGet<Standing[]>(`/football/standings${query}`),
    ]);
    return {
      overview,
      competitions,
      selectedId,
      matches: asAgenda(matches),
      standings: Array.isArray(standings) ? standings : [],
    };
  } catch {
    return {
      overview: { note: 'API non raggiungibile o database non ancora avviato.', counts: { competitions: 0, teams: 0, matches: 0 } },
      competitions: [],
      selectedId: undefined,
      matches: { recent: [] as AgendaMatch[], upcoming: [] as AgendaMatch[] },
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
    <>
      <PageHero kicker="Calcio · Italia" title={selected?.name ?? 'Calcio'}>
        <p className="disclaimer">
          Nessun risultato inventato: i punteggi appaiono solo se la fonte ha chiuso la gara.
        </p>
      </PageHero>

      <div className="grid">
        <div className="card stat">
          <span>Competizioni</span>
          <strong>{overview.counts?.competitions ?? 0}</strong>
        </div>
        <div className="card stat">
          <span>Squadre</span>
          <strong>{overview.counts?.teams ?? 0}</strong>
        </div>
        <div className="card stat">
          <span>Partite</span>
          <strong>{overview.counts?.matches ?? 0}</strong>
        </div>
      </div>

      {competitions.length > 0 ? (
        <div className="card tabs">
          {competitions.map((competition) => (
            <Link
              key={competition.id}
              href={`/football?c=${competition.id}`}
              className={`chip ${selectedId === competition.id ? 'chip-active' : 'chip-data'}`}
            >
              {competition.name}
            </Link>
          ))}
        </div>
      ) : null}

      <h2>Classifica</h2>
      {standings.length > 0 ? (
        <div className="card table-wrap">
          <span className="badge badge-data">DATI</span>
          <table className="data">
            <thead>
              <tr>
                <th>#</th>
                <th>Squadra</th>
                <th>Pt</th>
                <th>G</th>
                <th>V</th>
                <th>N</th>
                <th>P</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={`${row.position}-${row.team.name}`}>
                  <td className="pos">{row.position}</td>
                  <td>{row.team.name}</td>
                  <td>{row.points}</td>
                  <td>{row.played}</td>
                  <td>{row.won ?? '—'}</td>
                  <td>{row.drawn ?? '—'}</td>
                  <td>{row.lost ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            title="Classifica in attesa"
            body="Nessuna tabella ufficiale in archivio per questo campionato. Non viene generata una classifica fittizia."
          />
        </div>
      )}

      <MatchAgenda recent={matches.recent} upcoming={matches.upcoming} />
    </>
  );
}
