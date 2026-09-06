'use client';

import { useMemo, useState } from 'react';
import type { AgendaMatch } from '../lib/agenda';
import { filterMatches } from '../lib/sport-search';
import { MatchAgenda } from './match-agenda';
import { SportSearchField } from './sport-search-field';

export function SearchableAgenda({
  recent,
  upcoming,
}: {
  recent: AgendaMatch[];
  upcoming: AgendaMatch[];
}) {
  const [query, setQuery] = useState('');
  const filteredRecent = useMemo(() => filterMatches(recent, query), [recent, query]);
  const filteredUpcoming = useMemo(() => filterMatches(upcoming, query), [upcoming, query]);
  const total = recent.length + upcoming.length;
  const shown = filteredRecent.length + filteredUpcoming.length;

  return (
    <div className="sport-search-wrap">
      <SportSearchField value={query} onChange={setQuery} />
      {query.trim() ? (
        <p className="muted sport-search-meta">
          {shown} di {total} incontri per «{query.trim()}»
        </p>
      ) : null}
      <MatchAgenda
        recent={filteredRecent}
        upcoming={filteredUpcoming}
        emptyTitle={query.trim() ? 'Nessun incontro trovato' : undefined}
        emptyBody={query.trim() ? 'Prova un altro nome oppure svuota la ricerca.' : undefined}
      />
    </div>
  );
}
