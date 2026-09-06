import { apiGet } from '../../lib/api';

type StatsPayload = {
  note?: string;
  items?: Array<{
    competition: string;
    team: string;
    position: number;
    points: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    goalsFor: number;
    goalsAgainst: number;
  }>;
};

export default async function StatisticsPage() {
  let payload: StatsPayload = { items: [] };
  try {
    payload = await apiGet<StatsPayload>('/statistics');
  } catch {
    payload = { items: [] };
  }
  const items = payload.items ?? [];

  return (
    <div>
      <span className="badge">STATISTICHE</span>
      <h1>Statistiche</h1>
      <p>
        Motore generico indipendente dallo sport: win rate, medie, forma. Questo livello non è ANALISI AI.
      </p>
      <p className="disclaimer">{payload.note ?? 'Solo dati già in archivio. 18+.'}</p>
      {items.length === 0 ? (
        <div className="card">Nessuna statistica calcolabile: manca la classifica in archivio.</div>
      ) : (
        items.map((row) => (
          <div className="card" key={`${row.competition}-${row.team}`}>
            <span className="badge">STATISTICHE</span>
            <h3>
              {row.position}. {row.team}
            </h3>
            <p>
              {row.competition} · {row.points} pt · {row.played} gare · {row.wins}V {row.draws}N {row.losses}P ·
              win rate {(row.winRate * 100).toFixed(0)}% · gol {row.goalsFor}:{row.goalsAgainst}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
