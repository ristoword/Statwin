import Link from 'next/link';

export function MatchCard({
  href,
  home,
  away,
  homeScore,
  awayScore,
  status,
  estimate,
  lines = [],
}: {
  href: string;
  home?: string;
  away?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
  estimate?: { home?: number; away?: number } | null;
  lines?: string[];
}) {
  const official = homeScore != null && awayScore != null;
  return (
    <Link href={href} className="match-card">
      <div className="match-card-top">
        <span className="badge">{status ?? 'n/d'}</span>
        {lines[0] ? <span className="muted">{lines[0]}</span> : null}
      </div>
      <div className="match">
        <div className="match-team">{home ?? 'Casa'}</div>
        <div className={`scoreboard${official ? '' : ' estimated'}`}>
          <b>{official ? homeScore : '–'}</b>
          <span>:</span>
          <b>{official ? awayScore : '–'}</b>
        </div>
        <div className="match-team right">{away ?? 'Trasferta'}</div>
      </div>
      {!official && estimate?.home != null && estimate.away != null ? (
        <p className="estimate-line">Stima modello {estimate.home}–{estimate.away} · non è un DATO</p>
      ) : null}
      {lines.slice(1).length > 0 ? (
        <div className="match-card-meta">
          {lines.slice(1).map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
