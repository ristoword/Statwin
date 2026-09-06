import { inferFootballCountry, mergeLeagueIds } from './european-leagues';

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
});
