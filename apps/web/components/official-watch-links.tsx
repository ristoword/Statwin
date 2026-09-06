import type { OfficialWatchListing } from '../lib/live';

export function OfficialWatchLinks({ listings }: { listings: OfficialWatchListing[] }) {
  if (listings.length === 0) {
    return (
      <p className="muted">
        Nessun elenco ufficiale per questa gara. STATWIN non inventa un canale e non indica stream non legali.
      </p>
    );
  }

  return (
    <ul className="watch-links">
      {listings.map((listing) => (
        <li key={`${listing.id}-${listing.url}`}>
          <a className="watch-link" href={listing.url} target="_blank" rel="noopener noreferrer">
            <span className="watch-link-kind">
              {listing.kind === 'official_league' ? 'Lega ufficiale' : 'Broadcaster autorizzato'}
            </span>
            <strong>{listing.label}</strong>
            {listing.territory ? <span className="muted">{listing.territory}</span> : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
