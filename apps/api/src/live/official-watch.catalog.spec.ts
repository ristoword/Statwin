import { listingFromStation, looksUnofficial, sanitizeListings } from './official-watch.allowlist';
import { findCatalogEntry, listingsForCompetition } from './official-watch.catalog';
import { mergeOfficialListings } from './live.service';

describe('official watch catalog', () => {
  it('maps Serie A, Premier League, UEFA and Bundesliga to official pages', () => {
    expect(findCatalogEntry('Serie A', 'Italy')?.id).toBe('serie-a');
    expect(findCatalogEntry('Premier League')?.id).toBe('premier-league');
    expect(findCatalogEntry('UEFA Champions League')?.id).toBe('ucl');
    expect(findCatalogEntry('1. Bundesliga', 'Germany')?.id).toBe('bundesliga');
    expect(findCatalogEntry('2. Bundesliga')?.id).toBe('bundesliga-2');
    expect(findCatalogEntry('Serie C Girone C')?.id).toBe('serie-c');
  });

  it('does not invent a listing for unknown competitions', () => {
    expect(findCatalogEntry('Torneo amatoriale di quartiere')).toBeNull();
    expect(listingsForCompetition('Amatori Roma Nord')).toEqual([]);
  });

  it('returns only https official hosts', () => {
    const listings = listingsForCompetition('Serie A');
    expect(listings.length).toBeGreaterThan(0);
    for (const item of listings) {
      expect(item.url.startsWith('https://')).toBe(true);
      expect(item.url).toMatch(/legaseriea\.it|dazn\.com/);
      expect(item.note).toContain('Non è lo stream');
    }
  });

  it('keeps official TheSportsDB station names and drops pirate labels', () => {
    expect(listingFromStation('DAZN')?.url).toContain('dazn.com');
    expect(listingFromStation('Sky Sports Main Event')?.label).toBe('Sky Sports');
    expect(listingFromStation('streameast hd')).toBeNull();
    expect(listingFromStation('Reddit Soccer Streams')).toBeNull();
    expect(listingFromStation('Free IPTV')).toBeNull();
    expect(looksUnofficial('crackstreams.biz')).toBe(true);
  });

  it('never returns unofficial URLs even if mixed in', () => {
    const merged = mergeOfficialListings('Serie A', 'Italy', 'DAZN, streameast, SoccerStreams');
    expect(merged.some((item) => item.label === 'DAZN' || item.url.includes('dazn.com'))).toBe(true);
    expect(merged.every((item) => !/stream|iptv|reddit/i.test(item.label + item.url))).toBe(true);
    expect(
      sanitizeListings([
        { label: 'Pirate', url: 'https://streameast.example/live' },
        { label: 'Lega Serie A', url: 'https://www.legaseriea.it/' },
      ]).map((item) => item.url),
    ).toEqual(['https://www.legaseriea.it/']);
  });
});
