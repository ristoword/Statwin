export type OfficialWatchKind = 'official_league' | 'licensed_broadcaster';

export type OfficialWatchSource = 'competition_catalog' | 'thesportsdb_tv';

export type OfficialWatchListing = {
  id: string;
  label: string;
  url: string;
  kind: OfficialWatchKind;
  territory?: string;
  note: string;
  source: OfficialWatchSource;
};

export type CatalogEntry = {
  id: string;
  aliases: string[];
  country: string;
  listings: Array<Omit<OfficialWatchListing, 'source'>>;
};

export const DESTINATION_NOTE =
  'Pagina ufficiale di destinazione: elenco legale / dove guardare. Non è lo stream di questa singola gara.';
