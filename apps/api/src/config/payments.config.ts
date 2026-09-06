import { registerAs } from '@nestjs/config';

export default registerAs('payments', () => ({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  prices: {
    premium: process.env.STRIPE_PRICE_PREMIUM ?? '',
    pro: process.env.STRIPE_PRICE_PRO ?? '',
  },
}));
