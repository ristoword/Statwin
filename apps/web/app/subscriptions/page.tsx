import { apiGet } from '../../lib/api';
import { PageHero } from '../../components/page-hero';

type Plan = { plan: string; limits?: Record<string, boolean | number> };

const COPY: Record<string, { title: string; price: string; blurb: string; featured?: boolean }> = {
  FREE: { title: 'Free', price: '0', blurb: 'DATI e STATISTICHE di base per entrare nel desk.' },
  PREMIUM: {
    title: 'Premium',
    price: '19',
    blurb: 'Aggiunge le PROBABILITÀ modellistiche sulle partite in archivio.',
    featured: true,
  },
  PRO: { title: 'Pro', price: '49', blurb: 'Sblocca i report ANALISI AI e la lettura completa a quattro livelli.' },
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
      <div className="grid">
        {plans.map((item) => {
          const copy = COPY[item.plan] ?? { title: item.plan, price: '—', blurb: '' };
          return (
            <div className={`card${copy.featured ? ' featured' : ''}`} key={item.plan}>
              <span className="badge badge-prob">{item.plan}</span>
              <h3>{copy.title}</h3>
              <p className="price">
                {copy.price}€<span> /mese</span>
              </p>
              <p>{copy.blurb}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
