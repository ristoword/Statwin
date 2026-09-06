import Link from 'next/link';

export function PlanLock({
  required,
  title,
  body,
}: {
  required: 'PREMIUM' | 'PRO';
  title: string;
  body: string;
}) {
  return (
    <div className="card plan-lock">
      <span className={`badge ${required === 'PRO' ? 'badge-ai' : 'badge-prob'}`}>{required}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      <p className="disclaimer">I piani limitano funzioni, non promettono vincite. 18+.</p>
      <Link className="btn" href="/subscriptions">
        Vedi i piani
      </Link>
    </div>
  );
}
