import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getHealth() {
  try {
    const res = await fetch(`${API}/api/v1/health`, { cache: 'no-store' });
    return res.json();
  } catch {
    return { status: 'offline' };
  }
}

export default async function Home() {
  const health = await getHealth();
  return (
    <div>
      <h1>STATWIN</h1>
      <p>Piattaforma SaaS di analisi statistica sportiva. Sport principale: calcio.</p>
      <p className="disclaimer">
        Disclaimer: STATWIN non promette vincite. Le probabilità sono stime modellistiche. Uso riservato a maggiorenni.
      </p>
      <div className="card">
        <span className="badge">API {health.status ?? 'unknown'}</span>
        <p>Swagger: {API}/docs</p>
      </div>
      <div className="grid">
        <Link className="card" href="/football">Calcio — attivo</Link>
        <Link className="card" href="/basketball">Basket — in arrivo</Link>
        <Link className="card" href="/volleyball">Pallavolo — in arrivo</Link>
        <Link className="card" href="/tennis">Tennis — in arrivo</Link>
        <Link className="card" href="/horse-racing">Ippica — in arrivo</Link>
      </div>
    </div>
  );
}
