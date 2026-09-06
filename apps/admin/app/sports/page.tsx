import { apiGet } from '../../lib/api';

type Sport = { slug: string; name: string; isActive: boolean };

export default async function SportsPage() {
  let sports: Sport[] = [];
  try {
    const data = await apiGet<Sport[]>('/sports');
    sports = Array.isArray(data) ? data : [];
  } catch {
    sports = [];
  }
  return (
    <section>
      <h1>Sport</h1>
      {sports.map((sport) => (
        <div className="card" key={sport.slug}>
          {sport.name} — {sport.isActive ? 'attivo' : 'predisposto'}
        </div>
      ))}
    </section>
  );
}
