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
  [AppPlan.PREMIUM]: 1900,
  [AppPlan.PRO]: 4900,
};

export const PLAN_LAYERS: Record<AppPlan, string[]> = {
  [AppPlan.FREE]: ['DATI', 'STATISTICHE'],
  [AppPlan.PREMIUM]: ['DATI', 'STATISTICHE', 'PROBABILITÀ'],
  [AppPlan.PRO]: ['DATI', 'STATISTICHE', 'PROBABILITÀ', 'ANALISI AI'],
};

const RANK: Record<string, number> = { FREE: 0, PREMIUM: 1, PRO: 2 };

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
  }));
}
