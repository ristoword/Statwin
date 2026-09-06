import { EMPTY_SPORTS, findWiredSport, WIRED_TSD_SPORTS } from './wired-sports';

describe('wired sports catalog', () => {
  it('wires major non-football desks with TheSportsDB league IDs', () => {
    expect(findWiredSport('tennis')?.defaultLeagues).toContain('4464');
    expect(findWiredSport('american-football')?.defaultLeagues).toBe('4391');
    expect(findWiredSport('ice-hockey')?.defaultLeagues).toBe('4380');
    expect(findWiredSport('baseball')?.defaultLeagues).toBe('4424');
    expect(findWiredSport('formula1')?.defaultLeagues).toBe('4370');
    expect(WIRED_TSD_SPORTS.length).toBeGreaterThanOrEqual(8);
  });

  it('keeps horse racing empty without a fake calendar', () => {
    expect(findWiredSport('horse-racing')).toBeUndefined();
    expect(EMPTY_SPORTS.some((item) => item.slug === 'horse-racing')).toBe(true);
  });

  it('prefixes external ids per sport to avoid collisions', () => {
    const prefixes = WIRED_TSD_SPORTS.map((item) => item.prefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
    expect(findWiredSport('mma')?.prefix).toBe('tsd:ufc');
  });
});
