'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { getAccessToken } from '../lib/auth-storage';
import { SubscribeButton } from './subscribe-button';
import { trialUntilLabel } from '../lib/trial';

type Plan = {
  plan: string;
  limits?: Record<string, boolean | number>;
  layers?: string[];
  priceCents?: number;
  copy?: string;
};

type SubscriptionMe = {
  plan?: string;
  trialEndsAt?: string | null;
  effectivePlan?: string;
};

const COPY: Record<string, { title: string; price: string; blurb: string; featured?: boolean }> = {
  FREE: {
    title: 'Free',
    price: '0',
    blurb:
      '15 giorni Pro per capire l’app (AI e probabilità), poi solo DATI e STATISTICHE se non ti abboni. Non promette vincite.',
  },
  PREMIUM: {
    title: 'Premium',
    price: '6,99',
    blurb: 'Aggiunge le PROBABILITÀ modellistiche sulle partite in archivio.',
    featured: true,
  },
  PRO: { title: 'Pro', price: '12,99', blurb: 'Sblocca i report ANALISI AI e la lettura completa a quattro livelli.' },
};

export function PlanGrid({ plans }: { plans: Plan[] }) {
  const [current, setCurrent] = useState<string | null>(null);
  const [trialLabel, setTrialLabel] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    apiGet<SubscriptionMe>('/subscriptions/me', token)
      .then((sub) => {
        setCurrent(sub.plan ?? 'FREE');
        setTrialLabel(trialUntilLabel(sub.trialEndsAt, sub.plan));
      })
      .catch(() => setCurrent('FREE'));
  }, []);

  return (
    <>
      {trialLabel ? <p className="disclaimer">{trialLabel}</p> : null}
      <div className="grid">
      {plans.map((item) => {
        const copy = COPY[item.plan] ?? { title: item.plan, price: '—', blurb: '' };
        const layers = item.layers?.join(' · ');
        const blurb = item.copy ?? copy.blurb;
        return (
          <div className={`card${copy.featured ? ' featured' : ''}`} key={item.plan}>
            <span className="badge badge-prob">{item.plan}</span>
            {current === item.plan ? <p className="muted">Piano attuale</p> : null}
            <h3>{copy.title}</h3>
            <p className="price">
              {copy.price}€<span> /mese</span>
            </p>
            <p>{blurb}</p>
            {layers ? <p className="muted">{layers}</p> : null}
            {item.plan === 'FREE' ? (
              <p className="muted">Incluso alla registrazione.</p>
            ) : (
              <SubscribeButton
                plan={item.plan as 'PREMIUM' | 'PRO'}
                label={`Passa a ${copy.title}`}
                current={current}
              />
            )}
          </div>
        );
      })}
      </div>
    </>
  );
}
