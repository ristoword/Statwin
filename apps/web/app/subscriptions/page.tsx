import { apiGet } from '../../lib/api';
import { PageHero } from '../../components/page-hero';
import { PlanGrid } from '../../components/plan-grid';

type Plan = {
  plan: string;
  limits?: Record<string, boolean | number>;
  layers?: string[];
  priceCents?: number;
};

export default async function SubscriptionsPage() {
  let plans: Plan[] = [];
  try {
    const data = await apiGet<Plan[]>('/subscriptions/plans');
    plans = Array.isArray(data) ? data : [];
  } catch {
    plans = [{ plan: 'FREE' }, { plan: 'PREMIUM' }, { plan: 'PRO' }];
  }

  return (
    <>
      <PageHero kicker="Abbonamenti" title="Piani">
        <p className="disclaimer">I piani limitano funzioni, non promettono vincite.</p>
      </PageHero>
      <PlanGrid plans={plans} />
    </>
  );
}
