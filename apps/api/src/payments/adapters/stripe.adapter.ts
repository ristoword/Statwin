import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckoutInput, PaymentProvider } from '../interfaces/payment-provider';

@Injectable()
export class StripeAdapter implements PaymentProvider {
  constructor(private readonly config: ConfigService) {}

  async createCheckout(input: CheckoutInput) {
    const key = this.config.get<string>('payments.stripeSecretKey');
    if (!key) {
      return {
        provider: 'stripe',
        url: `${input.successUrl}?mock=1&plan=${input.plan}`,
      };
    }
    return {
      provider: 'stripe',
      url: `${input.successUrl}?configured=1&plan=${input.plan}`,
    };
  }
}
