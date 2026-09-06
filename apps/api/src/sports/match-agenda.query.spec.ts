import { mergeFeaturedUpcoming, matchSearchWhere } from './match-agenda.query';

function row(id: string, kickoff: string) {
  return { id, kickoff };
}

describe('match agenda listing', () => {
  it('keeps a late Serie A fixture when 40 earlier games would have dropped it', () => {
    const earlier = Array.from({ length: 40 }, (_, index) =>
      row(`early-${index}`, `2026-09-06T12:${String(index).padStart(2, '0')}:00.000Z`),
    );
    const juveMilan = row('juve-milan', '2026-09-06T18:45:00.000Z');
    const merged = mergeFeaturedUpcoming(earlier, [juveMilan], 40, 12);

    expect(merged.some((item) => item.id === 'juve-milan')).toBe(true);
    expect(merged[merged.length - 1]?.id).toBe('juve-milan');
    expect(merged).toHaveLength(40);
  });

  it('builds a case-insensitive team/competition search clause', () => {
    expect(matchSearchWhere('  ')).toEqual({});
    expect(matchSearchWhere('Juventus')).toEqual({
      OR: [
        { homeTeam: { name: { contains: 'Juventus', mode: 'insensitive' } } },
        { awayTeam: { name: { contains: 'Juventus', mode: 'insensitive' } } },
        { competition: { name: { contains: 'Juventus', mode: 'insensitive' } } },
      ],
    });
  });
});
