export type UserRole = 'USER' | 'PREMIUM_USER' | 'ADMIN';
export type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'PRO';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  plan: SubscriptionPlan;
}

export interface Sport {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}
