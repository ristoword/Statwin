import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiGet } from '../lib/api';
import { asMatchDesk, type AgendaMatch } from '../lib/agenda';
import { getServerAccessToken } from '../lib/server-auth';
import { findSport } from '../lib/sports-catalog';
import {
  defaultCompetition,
  groupSportSections,
  sectionFor,
  type DeskCompetition,
} from '../lib/sport-sections';
import { AiSportPath } from './ai-sport-path';
import { EmptyState } from './empty-state';
import { MatchAgenda } from './match-agenda';
import { PageHero } from './page-hero';
import { PossibleResults } from './possible-results';

type SportOverview = {
  sport?: { name: string };
  counts?: { competitions: number; teams: number; matches: number };
  note?: string;
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

async function load(apiPath: string, sportSlug: string, competitionId?: string) {
  try {
    const [overview, rawCompetitions] = await Promise.all([
      apiGet<SportOverview>(`/${apiPath}`),
      apiGet<DeskCompetition[]>(`/${apiPath}/competitions`),
    ]);
    const competitions = Array.isArray(rawCompetitions) ? rawCompetitions : [];
    const selected = defaultCompetition(competitions, sportSlug, competitionId);
    const query = selected?.id ? `?competitionId=${selected.id}` : '';
    const token = await getServerAccessToken();
    const [rawMatches, standings] = await Promise.all([
      apiGet<unknown>(`/${apiPath}/matches${query}`, token),
      apiGet<Standing[]>(`/${apiPath}/standings${query}`),
    ]);
    return {
      overview,
      competitions,
      selected,
      matches: asMatchDesk(rawMatches),
      standings: Array.isArray(standings) ? standings : [],
    };
  } catch {
    return {
      overview: {
        note: 'API non raggiungibile o database non ancora avviato.',
        counts: { competitions: 0, teams: 0, matches: 0 },
      },
      competitions: [] as DeskCompetition[],
      selected: undefined as DeskCompetition | undefined,
      matches: {
        recent: [] as AgendaMatch[],
        upcoming: [] as AgendaMatch[],
        probabilitiesLocked: false,
      },
      standings: [] as Standing[],
    };
  }
}

export async function SportDesk({
  slug,
  competitionId,
}: {
  slug: string;
  competitionId?: string;
}) {
  const sport = findSport(slug);
  if (!sport) notFound();

  const { overview, competitions, selected, matches, standings } = await load(
    sport.apiPath,
    sport.slug,
    competitionId,
  );
  const sections = groupSportSections(competitions, sport.slug);
  const activeSection = sectionFor(selected, sport.slug, sections);
  const selectedId = selected?.id;
  const emptyArchive =
    competitions.length === 0 && (overview.counts?.matches ?? 0) === 0 && standings.length === 0;

  return (
    <>
      <PageHero
        kicker={`${sport.focus} · ${activeSection?.label ?? sport.name}`}
        title={selected?.name ?? sport.name}
      >
        <p className="disclaimer">
          18+. STATWIN è analisi sportiva, non un bookmaker. Nessuna vincita promessa. Nessun
          risultato inventato: i punteggi appaiono solo se la fonte ha chiuso la gara.
        </p>
        <p>{sport.blurb}</p>
      </PageHero>

      <div className="grid">
        <div className="card stat">
          <span>Competizioni</span>
          <strong>{overview.counts?.competitions ?? 0}</strong>
        </div>
        <div className="card stat">
          <span>Squadre / atleti</span>
          <strong>{overview.counts?.teams ?? 0}</strong>
        </div>
        <div className="card stat">
          <span>{sport.eventNoun}</span>
          <strong>{overview.counts?.matches ?? 0}</strong>
        </div>
      </div>

      {sections.length > 0 ? (
        <div className="card league-board nation-board">
          <section className="league-country">
            <p className="muted league-country-label">
              {sport.slug === 'football' ? 'Nazioni' : 'Sezioni'}
            </p>
            <div className="tabs nation-tabs">
              {sections.map((section) => {
                const first = section.competitions[0];
                return (
                  <Link
                    key={section.key}
                    href={`${sport.href}?c=${first.id}`}
                    className={`chip ${activeSection?.key === section.key ? 'chip-active' : 'chip-data'}`}
                  >
                    {section.label}
                  </Link>
                );
              })}
            </div>
          </section>
          {activeSection ? (
            <section className="league-country">
              <p className="muted league-country-label">{activeSection.label} · competizioni</p>
              <div className="tabs">
                {activeSection.competitions.map((competition) => (
                  <Link
                    key={competition.id}
                    href={`${sport.href}?c=${competition.id}`}
                    className={`chip ${selectedId === competition.id ? 'chip-active' : 'chip-stats'}`}
                  >
                    {competition.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
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
            body="Nessuna tabella ufficiale in archivio per questa competizione. Non viene generata una classifica fittizia."
          />
        </div>
      )}

      {emptyArchive ? (
        <div className="card coming-panel">
          <EmptyState
            title={`${sport.name}: nessun dato sincronizzato`}
            body={
              overview.note ??
              `L'archivio resta vuoto finché il provider non restituisce gare. Nessun punteggio viene inventato.`
            }
          />
        </div>
      ) : (
        <MatchAgenda recent={matches.recent} upcoming={matches.upcoming} />
      )}

      <PossibleResults upcoming={matches.upcoming} locked={matches.probabilitiesLocked} />

      <AiSportPath
        sportSlug={sport.slug}
        sportName={sport.name}
        eventNoun={sport.eventNoun}
        matches={[...matches.upcoming, ...matches.recent]}
      />
    </>
  );
}
