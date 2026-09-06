import { collectTsdLeagueEvents, tsdSeasonCandidates, type TsdGetJson } from './tsd-client';

const juveMilan = {
  idEvent: 'juve-milan-2026-09-06',
  strEvent: 'Juventus vs AC Milan',
  strHomeTeam: 'Juventus',
  strAwayTeam: 'AC Milan',
  dateEvent: '2026-09-06',
  strTime: '18:45:00',
  strTimestamp: '2026-09-06T18:45:00+00:00',
};

describe('collectTsdLeagueEvents', () => {
  it('imports Juventus–Milan from eventsnextleague when the season calendar is empty', async () => {
    const calls: string[] = [];
    const getJson: TsdGetJson = async (path) => {
      calls.push(path);
      if (path.startsWith('/eventsseason.php')) return { events: [] } as never;
      if (path.startsWith('/eventsnextleague.php')) return { events: [juveMilan] } as never;
      throw new Error(`unexpected ${path}`);
    };
    const events = await collectTsdLeagueEvents(
      getJson,
      '4332',
      tsdSeasonCandidates('2026-2027'),
    );

    expect(events.some((event) => event.idEvent === juveMilan.idEvent)).toBe(true);
    expect(events[0]?.strHomeTeam).toBe('Juventus');
    expect(events[0]?.strAwayTeam).toBe('AC Milan');
    expect(calls.some((path) => path.includes('eventsnextleague.php?id=4332'))).toBe(true);
  });

  it('stops at the first non-empty season and still merges upcoming fixtures', async () => {
    const seasonsTried: string[] = [];
    const seasonMatch = {
      idEvent: 'past-1',
      strHomeTeam: 'Atalanta',
      strAwayTeam: 'Roma',
    };
    const getJson: TsdGetJson = async (path) => {
      if (path.startsWith('/eventsseason.php')) {
        const season = new URL(`https://tsd.test${path}`).searchParams.get('s') ?? '';
        seasonsTried.push(season);
        if (season === '2026-2027') return { events: [seasonMatch] } as never;
        return { events: [{ idEvent: 'wrong-season', strHomeTeam: 'Old', strAwayTeam: 'Club' }] } as never;
      }
      return { events: [juveMilan] } as never;
    };
    const events = await collectTsdLeagueEvents(
      getJson,
      '4332',
      ['2026-2027', '2026', '2025-2026'],
    );

    expect(seasonsTried).toEqual(['2026-2027']);
    expect(events.map((event) => event.idEvent).sort()).toEqual(['juve-milan-2026-09-06', 'past-1']);
  });

  it('keeps season events when eventsnextleague fails', async () => {
    const seasonMatch = { idEvent: 'season-only', strHomeTeam: 'Napoli', strAwayTeam: 'Lazio' };
    const getJson: TsdGetJson = async (path) => {
      if (path.startsWith('/eventsseason.php')) return { events: [seasonMatch] } as never;
      throw new Error('TheSportsDB /eventsnextleague.php failed: 429');
    };
    const events = await collectTsdLeagueEvents(
      getJson,
      '4332',
      ['2026-2027'],
    );

    expect(events).toEqual([seasonMatch]);
  });
});
