import type { AgendaMatch } from './agenda';

export function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function textMatches(haystack: Array<string | null | undefined>, term: string): boolean {
  if (!term) return true;
  return haystack
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .toLowerCase()
    .includes(term);
}

export function filterMatches<T extends AgendaMatch>(items: T[], query: string): T[] {
  const term = normalizeSearch(query);
  if (!term) return items;
  return items.filter((match) =>
    textMatches(
      [match.homeTeam?.name, match.awayTeam?.name, match.competition?.name, match.sport?.name],
      term,
    ),
  );
}

export function filterNamed<T extends { name: string }>(items: T[], query: string): T[] {
  const term = normalizeSearch(query);
  if (!term) return items;
  return items.filter((item) => textMatches([item.name], term));
}
