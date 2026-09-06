import { AppPlan } from '../common/enums/roles.enum';
import { PLAN_FEATURES } from '../common/constants';

export const PLAN_LIMITS: Record<
  AppPlan,
  { aiReportsPerDay: number; predictionsPerDay: number; advancedStats: boolean }
> = {
  [AppPlan.FREE]: { aiReportsPerDay: 0, predictionsPerDay: 0, advancedStats: false },
  [AppPlan.PREMIUM]: { aiReportsPerDay: 0, predictionsPerDay: 50, advancedStats: true },
  [AppPlan.PRO]: { aiReportsPerDay: 100, predictionsPerDay: 500, advancedStats: true },
};

export const PLAN_PRICES_CENTS: Record<string, number> = {
  [AppPlan.FREE]: 0,
  [AppPlan.PREMIUM]: 699,
  [AppPlan.PRO]: 1299,
};

export const PLAN_LAYERS: Record<AppPlan, string[]> = {
  [AppPlan.FREE]: ['DATI', 'STATISTICHE'],
  [AppPlan.PREMIUM]: ['DATI', 'STATISTICHE', 'PROBABILITÀ'],
  [AppPlan.PRO]: ['DATI', 'STATISTICHE', 'PROBABILITÀ', 'ANALISI AI'],
};

const RANK: Record<string, number> = { FREE: 0, PREMIUM: 1, PRO: 2 };

export const TRIAL_DAYS = 15;

export const PLAN_COPY: Record<AppPlan, string> = {
  [AppPlan.FREE]:
    'I primi 15 giorni sono Pro (probabilità e Analisi AI) per capire l’app. Poi restano solo DATI e STATISTICHE, salvo abbonamento. Non promette vincite.',
  [AppPlan.PREMIUM]:
    'Aggiunge le PROBABILITÀ modellistiche. Stime statistiche, non certezze. Non promette vincite.',
  [AppPlan.PRO]:
    'Sblocca i report ANALISI AI e la lettura a quattro livelli. Commenta solo i dati in archivio. Non promette vincite.',
};

export function trialEndDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function isTrialActive(trialEndsAt?: Date | string | null): boolean {
  if (!trialEndsAt) {
    return false;
  }
  const end = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt);
  return !Number.isNaN(end.getTime()) && end.getTime() > Date.now();
}

export function effectivePlan(
  plan?: string | null,
  trialEndsAt?: Date | string | null,
): AppPlan {
  if (isTrialActive(trialEndsAt)) {
    return AppPlan.PRO;
  }
  if (plan === AppPlan.PREMIUM || plan === AppPlan.PRO) {
    return plan;
  }
  return AppPlan.FREE;
}

export function hasMinPlan(plan: string | undefined, required: AppPlan | 'FREE' | 'PREMIUM' | 'PRO') {
  return (RANK[plan ?? 'FREE'] ?? 0) >= (RANK[required] ?? 0);
}

export function catalogPlans() {
  return (Object.keys(PLAN_LIMITS) as AppPlan[]).map((plan) => ({
    plan,
    limits: PLAN_LIMITS[plan],
    features: PLAN_FEATURES[plan],
    layers: PLAN_LAYERS[plan],
    priceCents: PLAN_PRICES_CENTS[plan],
    copy: PLAN_COPY[plan],
  }));
}
