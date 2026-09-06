export interface Subscription {
  id: string;
  userId: string;
  plan: 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM';
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
}
