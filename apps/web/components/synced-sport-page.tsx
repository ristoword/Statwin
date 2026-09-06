import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiGet } from '../lib/api';
import { getServerAccessToken } from '../lib/server-auth';
import { asAgenda, type AgendaMatch } from '../lib/agenda';
import { findSport } from '../lib/sports-catalog';
import { AiSportPath } from './ai-sport-path';
import { EmptyState } from './empty-state';
import { MatchAgenda } from './match-agenda';
import { PageHero } from './page-hero';

type SportOverview = {
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

async function load(apiPath: string, competitionId?: string) {
  try {
    const [overview, rawCompetitions] = await Promise.all([
      apiGet<SportOverview>(`/${apiPath}`),
      apiGet<Competition[]>(`/${apiPath}/competitions`),
    ]);
    const competitions = Array.isArray(rawCompetitions) ? rawCompetitions : [];
    const selectedId = competitionId ?? competitions[0]?.id;
    const query = selectedId ? `?competitionId=${selectedId}` : '';
    const token = await getServerAccessToken();
    const [matches, standings] = await Promise.all([
      apiGet<unknown>(`/${apiPath}/matches${query}`, token),
      apiGet<Standing[]>(`/${apiPath}/standings${query}`),
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
      overview: {
        note: 'API non raggiungibile o database non ancora avviato.',
        counts: { competitions: 0, teams: 0, matches: 0 },
      },
      competitions: [] as Competition[],
      selectedId: undefined as string | undefined,
      matches: { recent: [] as AgendaMatch[], upcoming: [] as AgendaMatch[] },
      standings: [] as Standing[],
    };
  }
}

function groupByCountry(items: Competition[]) {
  const groups = new Map<string, Competition[]>();
  for (const item of items) {
    const key = item.country?.trim() || 'Internazionale';
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'it'))
    .map(([country, competitions]) => ({
      country,
      competitions: competitions.sort((a, b) => a.name.localeCompare(b.name, 'it')),
    }));
}

export async function SyncedSportPage({
  slug,
  competitionId,
}: {
  slug: string;
  competitionId?: string;
}) {
  const sport = findSport(slug);
  if (!sport) notFound();

  const { overview, competitions, selectedId, matches, standings } = await load(sport.apiPath, competitionId);
  const selected = competitions.find((item) => item.id === selectedId);
  const groups = groupByCountry(competitions);
  const emptyArchive =
    competitions.length === 0 &&
    (overview.counts?.matches ?? 0) === 0 &&
    standings.length === 0;

  return (
    <>
      <PageHero kicker={`${sport.focus} · Desk analitico`} title={selected?.name ?? sport.name}>
        <p className="disclaimer">
          18+. Nessun risultato inventato: i punteggi appaiono solo se la fonte ha chiuso la gara.
        </p>
        <p>{sport.blurb}</p>
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
          <span>{sport.eventNoun}</span>
          <strong>{overview.counts?.matches ?? 0}</strong>
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="card league-board">
          {groups.map((group) => (
            <section className="league-country" key={group.country}>
              <p className="muted league-country-label">{group.country}</p>
              <div className="tabs">
                {group.competitions.map((competition) => (
                  <Link
                    key={competition.id}
                    href={`${sport.href}?c=${competition.id}`}
                    className={`chip ${selectedId === competition.id ? 'chip-active' : 'chip-data'}`}
                  >
                    {competition.name}
                  </Link>
                ))}
              </div>
            </section>
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

      {emptyArchive ? (
        <div className="card coming-panel">
          <EmptyState
            title={`${sport.name}: nessun dato sincronizzato`}
            body={`L'archivio resta vuoto finche il provider non restituisce gare. Sincronizza con POST /api/v1/${sport.apiPath}/sync oppure POST /api/v1/sports/sync. Nessun punteggio viene inventato.`}
          />
        </div>
      ) : (
        <MatchAgenda recent={matches.recent} upcoming={matches.upcoming} />
      )}

      <AiSportPath
        sportSlug={sport.slug}
        sportName={sport.name}
        eventNoun={sport.eventNoun}
        matches={[...matches.upcoming, ...matches.recent]}
      />
    </>
  );
}
