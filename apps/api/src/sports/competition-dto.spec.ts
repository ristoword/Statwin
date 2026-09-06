import { competitionSection, toCompetitionDto, toFootballCompetitionDto } from './competition-dto';

describe('competition dto', () => {
  it('keeps the provider country and exposes a section for grouping', () => {
    expect(toCompetitionDto({ id: '1', name: 'Serie A', country: 'Italy', type: 'LEAGUE' })).toEqual({
      id: '1',
      name: 'Serie A',
      country: 'Italy',
      type: 'LEAGUE',
      section: 'Italy',
    });
    expect(toCompetitionDto({ id: '2', name: 'NBA', country: 'USA' }).country).toBe('USA');
  });

  it('maps empty or world countries to Internazionale and UEFA to Europe', () => {
    expect(competitionSection(null)).toBe('Internazionale');
    expect(competitionSection('World')).toBe('Internazionale');
    expect(competitionSection('Europe')).toBe('Europe');
    expect(toCompetitionDto({ id: '3', name: 'ATP', country: '  ' }).section).toBe('Internazionale');
  });

  it('does not invent a country when the provider omitted it', () => {
    expect(toCompetitionDto({ id: '4', name: 'Unknown Cup' }).country).toBeNull();
  });

  it('infers football country from league name or TheSportsDB id', () => {
    expect(toFootballCompetitionDto({ id: '5', name: 'Premier League' }).country).toBe('England');
    expect(toFootballCompetitionDto({ id: '6', name: 'Campionato', externalId: 'tsd:4335' }).country).toBe('Spain');
    expect(toFootballCompetitionDto({ id: '7', name: 'Unknown Cup' }).country).toBeNull();
  });
});
