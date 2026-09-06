import { apiGet } from '../../lib/api';

type Plan = { plan: string; limits?: Record<string, boolean | number> };

export default async function SubscriptionsPage() {
  let plans: Plan[] = [];
  try {
    const data = await apiGet<Plan[]>('/subscriptions/plans');
    plans = Array.isArray(data) ? data : [];
  } catch {
    plans = [
      { plan: 'FREE' },
      { plan: 'PREMIUM' },
      { plan: 'PRO' },
    ];
  }

  return (
    <div>
      <h1>Piani</h1>
      <p className="disclaimer">I piani limitano funzioni, non promettono vincite.</p>
      <div className="grid">
        {plans.map((item) => (
          <div className="card" key={item.plan}>
            <h3>{item.plan}</h3>
            <pre>{JSON.stringify(item.limits ?? {}, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
