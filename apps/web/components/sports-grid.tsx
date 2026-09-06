import Link from 'next/link';
import { SPORT_CATALOG, type SportDefinition } from '../lib/sports-catalog';

export function SportsGrid({
  sports = SPORT_CATALOG,
  compact = false,
}: {
  sports?: SportDefinition[];
  compact?: boolean;
}) {
  return (
    <div className={`grid sports-grid${compact ? ' sports-grid-compact' : ''}`}>
      {sports.map((sport) => (
        <Link
          key={sport.slug}
          className={`card sport-card${sport.status === 'predisposed' ? ' coming' : ''}`}
          href={sport.href}
        >
          <span className={`badge${sport.status === 'synced' ? ' badge-data' : ''}`}>
            {sport.status === 'synced' ? 'DATI' : 'PREDISPOSTO'}
          </span>
          <h3>{sport.name}</h3>
          <p className="muted sport-focus">{sport.focus}</p>
          <p>{sport.blurb}</p>
        </Link>
      ))}
    </div>
  );
}
