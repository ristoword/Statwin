import Link from 'next/link';
import type { Estimate } from '../lib/agenda';

const OUTCOME_LABEL: Record<string, string> = {
  HOME: '1',
  DRAW: 'X',
  AWAY: '2',
};

function pct(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

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
  estimate?: Estimate | null;
  lines?: string[];
}) {
  const official = homeScore != null && awayScore != null;
  const predicted = estimate?.predictedScore;
  const outcomes = estimate?.outcomes ?? [];
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
      {!official && predicted?.home != null && predicted.away != null ? (
        <p className="estimate-line">
          Stima modello {predicted.home}–{predicted.away} · non è un DATO
        </p>
      ) : null}
      {outcomes.length > 0 ? (
        <div className="card-markets">
          {outcomes.map((row) => (
            <span className="card-market" key={row.selection}>
              {OUTCOME_LABEL[row.selection] ?? row.selection} {pct(row.probability)}
            </span>
          ))}
        </div>
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
