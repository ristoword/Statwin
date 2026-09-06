export function isTrialActive(trialEndsAt?: string | Date | null): boolean {
  if (!trialEndsAt) {
    return false;
  }
  const end = new Date(trialEndsAt);
  return !Number.isNaN(end.getTime()) && end.getTime() > Date.now();
}

export function trialUntilLabel(
  trialEndsAt?: string | Date | null,
  storedPlan?: string | null,
): string | null {
  if (!isTrialActive(trialEndsAt)) {
    return null;
  }
  if (storedPlan && storedPlan !== 'FREE') {
    return null;
  }
  const end = new Date(trialEndsAt as string | Date);
  return `Pro di prova fino al ${end.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
}
