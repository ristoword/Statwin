export type CheckoutInput = {
  userId: string;
  plan: 'PREMIUM' | 'PRO';
  successUrl: string;
  cancelUrl: string;
};

export interface PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<{ url: string; provider: string }>;
}
