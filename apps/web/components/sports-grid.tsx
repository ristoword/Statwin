import Link from 'next/link';
import { SPORT_CATALOG, type SportDefinition } from '../lib/sports-catalog';

export type SportCard = SportDefinition & {
  counts?: { competitions: number; teams: number; matches: number };
};

export function SportsGrid({
  sports = SPORT_CATALOG,
  compact = false,
}: {
  sports?: SportCard[];
  compact?: boolean;
}) {
  return (
    <div className={`grid sports-grid${compact ? ' sports-grid-compact' : ''}`}>
      {sports.map((sport) => {
        const competitions = sport.counts?.competitions ?? 0;
        const matches = sport.counts?.matches ?? 0;
        const live = competitions > 0 || matches > 0;
        return (
          <Link
            key={sport.slug}
            className={`card sport-card${sport.status === 'predisposed' ? ' coming' : ''}`}
            href={sport.href}
          >
            <span className={`badge${sport.status === 'synced' ? ' badge-data' : ''}`}>
              {sport.status === 'synced' ? (live ? 'DATI' : 'SYNC') : 'PREDISPOSTO'}
            </span>
            <h3>{sport.name}</h3>
            <p className="muted sport-focus">{sport.focus}</p>
            <p>{sport.blurb}</p>
            {sport.status === 'synced' ? (
              <p className="muted">
                {competitions} competizioni · {matches} {sport.eventNoun}
              </p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
