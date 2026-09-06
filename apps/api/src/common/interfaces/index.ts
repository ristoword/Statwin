export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  plan: string;
  storedPlan?: string;
  trialEndsAt?: Date | string | null;
}
