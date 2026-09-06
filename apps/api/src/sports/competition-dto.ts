const WORLD = /^(world|worldwide|international|internazionale|global)$/i;
const EUROPE = /^(europe|europa|uefa)$/i;

export type CompetitionRow = {
  id: string;
  name: string;
  country?: string | null;
  type?: string | null;
};

export function competitionCountry(country?: string | null): string | null {
  const value = country?.trim();
  return value ? value : null;
}

export function competitionSection(country?: string | null): string {
  const value = competitionCountry(country);
  if (!value || WORLD.test(value)) return 'Internazionale';
  if (EUROPE.test(value)) return 'Europe';
  return value;
}

export function toCompetitionDto(row: CompetitionRow) {
  const country = competitionCountry(row.country);
  return {
    id: row.id,
    name: row.name,
    country,
    type: row.type ?? 'LEAGUE',
    section: competitionSection(country),
  };
}
