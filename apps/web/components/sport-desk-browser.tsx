'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { AgendaMatch } from '../lib/agenda';
import { filterMatches, filterNamed, normalizeSearch } from '../lib/sport-search';
import type { DeskCompetition, DeskSection } from '../lib/sport-sections';
import { AiSportPath } from './ai-sport-path';
import { EmptyState } from './empty-state';
import { MatchAgenda } from './match-agenda';
import { PossibleResults } from './possible-results';
import { SportSearchField } from './sport-search-field';

export type DeskStanding = {
  position: number;
  played: number;
  points: number;
  won?: number;
  drawn?: number;
  lost?: number;
  team: { name: string };
  season?: { name?: string | null };
};

export type DeskStandingFormat = 'points' | 'win-loss' | 'ranking' | 'none';

export function SportDeskBrowser({
  sportHref,
  sportSlug,
  sportName,
  eventNoun,
  nationLabel,
  sections,
  activeSectionKey,
  selectedId,
  standings,
  standingsFormat,
  standingsNote,
  recent,
  upcoming,
  probabilitiesLocked,
  emptyArchive,
  emptyArchiveBody,
}: {
  sportHref: string;
  sportSlug: string;
  sportName: string;
  eventNoun: string;
  nationLabel: string;
  sections: DeskSection[];
  activeSectionKey?: string;
  selectedId?: string;
  standings: DeskStanding[];
  standingsFormat: DeskStandingFormat;
  standingsNote: string | null;
  recent: AgendaMatch[];
  upcoming: AgendaMatch[];
  probabilitiesLocked: boolean;
  emptyArchive: boolean;
  emptyArchiveBody: string;
}) {
  const [query, setQuery] = useState('');
  const term = normalizeSearch(query);

  const visibleSections = useMemo(() => {
    if (!term) return sections;
    return sections
      .map((section) => ({
        ...section,
        competitions: filterNamed(section.competitions, query),
      }))
      .filter((section) => section.competitions.length > 0);
  }, [query, sections, term]);

  const filteredStandings = useMemo(
    () => (term ? standings.filter((row) => row.team.name.toLowerCase().includes(term)) : standings),
    [standings, term],
  );
  const filteredRecent = useMemo(() => filterMatches(recent, query), [query, recent]);
  const filteredUpcoming = useMemo(() => filterMatches(upcoming, query), [query, upcoming]);

  const chipsSource = term ? visibleSections : sections;
  const chipSection = term
    ? undefined
    : sections.find((section) => section.key === activeSectionKey) ?? sections[0];

  return (
    <>
      <SportSearchField value={query} onChange={setQuery} />
      {term ? (
        <p className="muted sport-search-meta">
          {filteredUpcoming.length + filteredRecent.length} incontri · {filteredStandings.length} in
          classifica · {visibleSections.reduce((sum, section) => sum + section.competitions.length, 0)}{' '}
          competizioni per «{query.trim()}»
        </p>
      ) : null}

      {sections.length > 0 ? (
        <div className="card league-board nation-board">
          {term ? (
            chipsSource.length > 0 ? (
              chipsSource.map((section) => (
                <CompetitionChips
                  key={section.key}
                  label={`${section.label} · competizioni`}
                  competitions={section.competitions}
                  href={sportHref}
                  selectedId={selectedId}
                />
              ))
            ) : (
              <EmptyState
                title="Nessuna competizione trovata"
                body="Prova un altro nome oppure svuota la ricerca."
              />
            )
          ) : (
            <>
              <section className="league-country">
                <p className="muted league-country-label">{nationLabel}</p>
                <div className="tabs nation-tabs">
                  {sections.map((section) => {
                    const first = section.competitions[0];
                    return (
                      <Link
                        key={section.key}
                        href={`${sportHref}?c=${first.id}`}
                        className={`chip ${activeSectionKey === section.key ? 'chip-active' : 'chip-data'}`}
                      >
                        {section.label}
                      </Link>
                    );
                  })}
                </div>
              </section>
              {chipSection ? (
                <CompetitionChips
                  label={`${chipSection.label} · competizioni`}
                  competitions={chipSection.competitions}
                  href={sportHref}
                  selectedId={selectedId}
                />
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <h2>Classifica</h2>
      {filteredStandings.length > 0 ? (
        <StandingsTable rows={filteredStandings} format={standingsFormat} />
      ) : (
        <div className="card">
          <EmptyState
            title={
              term
                ? 'Nessuna squadra in classifica'
                : standingsNote === 'Classifica non fornita dalla fonte'
                  ? 'Classifica non fornita dalla fonte'
                  : 'Classifica in attesa'
            }
            body={
              term
                ? 'La ricerca non corrisponde a nessuna riga della tabella ufficiale.'
                : (standingsNote ??
                  'Nessuna tabella ufficiale in archivio per questa competizione. Non viene generata una classifica fittizia.')
            }
          />
        </div>
      )}

      {emptyArchive && !term ? (
        <div className="card coming-panel">
          <EmptyState title={`${sportName}: nessun dato sincronizzato`} body={emptyArchiveBody} />
        </div>
      ) : (
        <MatchAgenda
          recent={filteredRecent}
          upcoming={filteredUpcoming}
          emptyTitle={term ? 'Nessun incontro trovato' : undefined}
          emptyBody={
            term
              ? 'Prova un altro nome, cambia competizione oppure svuota la ricerca.'
              : undefined
          }
        />
      )}

      <PossibleResults upcoming={filteredUpcoming} locked={probabilitiesLocked} />

      <AiSportPath
        sportSlug={sportSlug}
        sportName={sportName}
        eventNoun={eventNoun}
        matches={[...filteredUpcoming, ...filteredRecent]}
      />
    </>
  );
}

function CompetitionChips({
  label,
  competitions,
  href,
  selectedId,
}: {
  label: string;
  competitions: DeskCompetition[];
  href: string;
  selectedId?: string;
}) {
  return (
    <section className="league-country">
      <p className="muted league-country-label">{label}</p>
      <div className="tabs">
        {competitions.map((competition) => (
          <Link
            key={competition.id}
            href={`${href}?c=${competition.id}`}
            className={`chip ${selectedId === competition.id ? 'chip-active' : 'chip-stats'}`}
          >
            {competition.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function StandingsTable({ rows, format }: { rows: DeskStanding[]; format: DeskStandingFormat }) {
  const showPoints = format === 'points' || rows.some((row) => (row.points ?? 0) > 0);
  const showDraws = format === 'points' || rows.some((row) => (row.drawn ?? 0) > 0);
  const showPlayed = format !== 'ranking' || rows.some((row) => (row.played ?? 0) > 0);
  const season = rows[0]?.season?.name;
  return (
    <div className="card table-wrap">
      <span className="badge badge-data">DATI</span>
      {season ? <p className="muted">Stagione {season}</p> : null}
      <table className="data">
        <thead>
          <tr>
            <th>#</th>
            <th>{format === 'ranking' ? 'Nome' : 'Squadra'}</th>
            {showPoints ? <th>Pt</th> : null}
            {showPlayed ? <th>G</th> : null}
            {format !== 'ranking' ? <th>V</th> : null}
            {showDraws ? <th>N</th> : null}
            {format !== 'ranking' ? <th>P</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.position}-${row.team.name}`}>
              <td className="pos">{row.position}</td>
              <td>{row.team.name}</td>
              {showPoints ? <td>{row.points}</td> : null}
              {showPlayed ? <td>{row.played}</td> : null}
              {format !== 'ranking' ? <td>{row.won ?? '—'}</td> : null}
              {showDraws ? <td>{row.drawn ?? '—'}</td> : null}
              {format !== 'ranking' ? <td>{row.lost ?? '—'}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
