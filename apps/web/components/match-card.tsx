import Link from 'next/link';

export function MatchCard({
  href,
  home,
  away,
  homeScore,
  awayScore,
  status,
  lines = [],
}: {
  href: string;
  home?: string;
  away?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
  lines?: string[];
}) {
  return (
    <Link href={href} className="match-card">
      <div className="match-card-top">
        <span className="badge">{status ?? 'n/d'}</span>
        {lines[0] ? <span className="muted">{lines[0]}</span> : null}
      </div>
      <div className="match">
        <div className="match-team">{home ?? 'Casa'}</div>
        <div className="scoreboard">
          <b>{homeScore ?? '–'}</b>
          <span>:</span>
          <b>{awayScore ?? '–'}</b>
        </div>
        <div className="match-team right">{away ?? 'Trasferta'}</div>
      </div>
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
