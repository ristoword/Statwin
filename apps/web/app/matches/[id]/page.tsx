import { apiV1 } from '../../../lib/api';

async function getMatch(id: string) {
  try {
    const res = await fetch(`${apiV1()}/matches/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function MatchAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  const sections = [
    'Squadra A',
    'Squadra B',
    'classifica',
    'forma',
    'rendimento casa',
    'rendimento trasferta',
    'gol',
    'head-to-head',
    'infortuni',
    'squalifiche',
    'formazioni',
    'statistiche avanzate',
    'quote',
    'probabilità modellistiche',
    'analisi AI',
  ];

  return (
    <div>
      <h1>Analisi partita</h1>
      <p className="disclaimer">Distinzione obbligatoria: DATI / STATISTICHE / PROBABILITÀ / ANALISI AI.</p>
      <div className="card">
        <span className="badge">DATI</span>
        <pre>{JSON.stringify(match ?? { id, empty: true }, null, 2)}</pre>
      </div>
      <div className="grid">
        {sections.map((title) => (
          <div className="card" key={title}>
            <span className="badge">{title.includes('AI') ? 'ANALISI AI' : title.includes('probabilità') ? 'PROBABILITÀ' : title.includes('statistiche') || title.includes('forma') || title.includes('rendimento') || title.includes('gol') || title.includes('head') ? 'STATISTICHE' : 'DATI'}</span>
            <h3>{title}</h3>
            <p>Sezione predisposta. Verrà popolata dai provider e dai motori, senza inventare dati.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
