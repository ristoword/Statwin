import { competitionSection, toCompetitionDto } from './competition-dto';

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
});
