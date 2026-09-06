import { inferFootballCountry, mergeLeagueIds, prioritizeFootballCompetitions } from './european-leagues';

describe('european football leagues', () => {
  it('keeps a short Railway list from dropping the European catalog', () => {
    expect(mergeLeagueIds('4332,4394,4398', '4328,4332,4335')).toEqual(['4328', '4332', '4335', '4394', '4398']);
  });

  it('infers country from name or external id without inventing unknown cups', () => {
    expect(inferFootballCountry('La Liga')).toBe('Spain');
    expect(inferFootballCountry('Campionato', null, 'tsd:4328')).toBe('England');
    expect(inferFootballCountry('1. Bundesliga', '  ', 'oldb:bl1')).toBe('Germany');
    expect(inferFootballCountry('Unknown Cup')).toBeUndefined();
  });

  it('syncs Serie A before OpenLiga and secondary TSD leagues so a 22s budget cannot skip it', () => {
    const ordered = prioritizeFootballCompetitions([
      { name: '1. Bundesliga', shortcut: 'bl1' },
      { name: 'Championship', shortcut: '4329' },
      { name: 'Premier League', shortcut: '4328' },
      { name: 'Scottish Premiership', shortcut: '4330' },
      { name: 'Serie A', externalId: 'tsd:4332' },
    ]);
    expect(ordered.map((item) => item.name)).toEqual([
      'Serie A',
      'Premier League',
      '1. Bundesliga',
      'Championship',
      'Scottish Premiership',
    ]);
  });
});
