import { AppPlan } from '../common/enums/roles.enum';

export const PLAN_LIMITS: Record<
  AppPlan,
  { aiReportsPerDay: number; predictionsPerDay: number; advancedStats: boolean }
> = {
  [AppPlan.FREE]: { aiReportsPerDay: 0, predictionsPerDay: 3, advancedStats: false },
  [AppPlan.PREMIUM]: { aiReportsPerDay: 10, predictionsPerDay: 50, advancedStats: true },
  [AppPlan.PRO]: { aiReportsPerDay: 100, predictionsPerDay: 500, advancedStats: true },
};
