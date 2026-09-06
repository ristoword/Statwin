import { apiGet } from '../../lib/api';
import { EmptyState } from '../../components/empty-state';
import { PageHero } from '../../components/page-hero';

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
    <>
      <PageHero kicker="Motore generico" title="Statistiche">
        <p>Win rate, medie e forma calcolati sui DATI. Questo livello non è ANALISI AI.</p>
        <p className="disclaimer">{payload.note ?? 'Solo dati già in archivio. 18+.'}</p>
      </PageHero>
      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Motore in attesa"
            body="Nessuna statistica calcolabile: manca la classifica in archivio."
          />
        </div>
      ) : (
        <div className="card table-wrap">
          <span className="badge badge-stats">STATISTICHE</span>
          <table className="data">
            <thead>
              <tr>
                <th>#</th>
                <th>Squadra</th>
                <th>Campionato</th>
                <th>Pt</th>
                <th>G</th>
                <th>V/N/P</th>
                <th>Win %</th>
                <th>Gol</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={`${row.competition}-${row.team}`}>
                  <td className="pos">{row.position}</td>
                  <td>{row.team}</td>
                  <td>{row.competition}</td>
                  <td>{row.points}</td>
                  <td>{row.played}</td>
                  <td>
                    {row.wins}/{row.draws}/{row.losses}
                  </td>
                  <td>{(row.winRate * 100).toFixed(0)}%</td>
                  <td>
                    {row.goalsFor}:{row.goalsAgainst}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
