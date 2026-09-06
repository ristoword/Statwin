import { AppPlan } from '../common/enums/roles.enum';
import {
  catalogPlans,
  effectivePlan,
  hasMinPlan,
  isTrialActive,
  trialEndDate,
  TRIAL_DAYS,
} from './plan-limits';

describe('trial effective plan', () => {
  const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const past = new Date(Date.now() - 60_000);

  it('gives new registrations a 15-day trial end', () => {
    const from = new Date('2026-09-06T10:00:00.000Z');
    expect(trialEndDate(from).toISOString()).toBe('2026-09-21T10:00:00.000Z');
    expect(TRIAL_DAYS).toBe(15);
  });

  it('treats an active trial as PRO even if stored plan is FREE', () => {
    expect(isTrialActive(future)).toBe(true);
    expect(effectivePlan('FREE', future)).toBe(AppPlan.PRO);
    expect(hasMinPlan(effectivePlan('FREE', future), AppPlan.PRO)).toBe(true);
    expect(hasMinPlan(effectivePlan('FREE', future), AppPlan.PREMIUM)).toBe(true);
  });

  it('falls back to stored FREE after the trial expires', () => {
    expect(isTrialActive(past)).toBe(false);
    expect(effectivePlan('FREE', past)).toBe(AppPlan.FREE);
    expect(hasMinPlan(effectivePlan('FREE', past), AppPlan.PREMIUM)).toBe(false);
    expect(hasMinPlan(effectivePlan('FREE', past), AppPlan.PRO)).toBe(false);
  });

  it('keeps a paid plan after trial expiry', () => {
    expect(effectivePlan('PREMIUM', past)).toBe(AppPlan.PREMIUM);
    expect(effectivePlan('PRO', past)).toBe(AppPlan.PRO);
    expect(hasMinPlan(effectivePlan('PREMIUM', past), AppPlan.PREMIUM)).toBe(true);
    expect(hasMinPlan(effectivePlan('PREMIUM', past), AppPlan.PRO)).toBe(false);
  });

  it('mentions the 15-day Pro trial on the Free catalog card', () => {
    const free = catalogPlans().find((item) => item.plan === AppPlan.FREE);
    expect(free?.copy).toMatch(/15 giorni/i);
    expect(free?.copy).toMatch(/Pro/i);
    expect(free?.copy).toMatch(/DATI/);
    expect(free?.copy).toMatch(/non promette vincite/i);
  });
});
