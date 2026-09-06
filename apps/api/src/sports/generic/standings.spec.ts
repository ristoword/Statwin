import { tsdSeasonCandidates } from '../../data-providers/thesportsdb/tsd-client';
import {
  classifyStandingFormat,
  leagueShortcutFromExternalId,
  standingsUnavailableNote,
  strengthFromStanding,
  toStandingsPayload,
} from './standings';

describe('standings helpers', () => {
  it('keeps football-style tables when draws or points are official', () => {
    expect(
      classifyStandingFormat('football', [{ played: 10, won: 6, drawn: 2, lost: 2, points: 20 }]),
    ).toBe('points');
    expect(
      classifyStandingFormat('rugby', [{ played: 8, won: 5, drawn: 0, lost: 3, points: 24 }]),
    ).toBe('points');
  });

  it('uses W-L for NBA/NFL/NHL even if points are present', () => {
    expect(
      classifyStandingFormat('basketball', [{ played: 20, won: 12, drawn: 0, lost: 8, points: 12 }]),
    ).toBe('win-loss');
    expect(
      classifyStandingFormat('american-football', [{ played: 6, won: 4, drawn: 0, lost: 2, points: 0 }]),
    ).toBe('win-loss');
    expect(
      classifyStandingFormat('ice-hockey', [{ played: 10, won: 6, drawn: 0, lost: 4, points: 12 }]),
    ).toBe('win-loss');
  });

  it('does not invent a table when the source has none', () => {
    expect(classifyStandingFormat('tennis', [])).toBe('none');
    expect(standingsUnavailableNote('tennis')).toBe('Classifica non fornita dalla fonte');
    expect(standingsUnavailableNote('formula1')).toBe('Classifica non fornita dalla fonte');
    expect(standingsUnavailableNote('mma')).toBe('Classifica non fornita dalla fonte');
    expect(toStandingsPayload('golf', 'c1', []).note).toBe('Classifica non fornita dalla fonte');
  });

  it('uses win rate for W-L sports and three-point strength for football', () => {
    expect(strengthFromStanding('basketball', { played: 10, won: 7, points: 0 })).toBe(0.7);
    expect(strengthFromStanding('football', { played: 10, won: 6, points: 20 })).toBeCloseTo(20 / 30);
    expect(strengthFromStanding('football', { played: 0, won: 0, points: 0 })).toBeNull();
  });

  it('tries official season aliases without inventing a table', () => {
    expect(tsdSeasonCandidates('2025-2026')).toEqual(
      expect.arrayContaining(['2025-2026', '2025', '2026', '2024-2025']),
    );
    expect(tsdSeasonCandidates('2025')).toEqual(expect.arrayContaining(['2025', '2025-2026', '2024-2025']));
  });

  it('reads TheSportsDB league id from prefixed external ids', () => {
    expect(leagueShortcutFromExternalId('tsd:nfl:4391')).toBe('4391');
    expect(leagueShortcutFromExternalId('tsd-bsk:4387')).toBe('4387');
    expect(leagueShortcutFromExternalId('oldb:bl1')).toBe('bl1');
    expect(leagueShortcutFromExternalId(null)).toBeUndefined();
  });
});
