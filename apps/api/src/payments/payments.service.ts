import { Inject, Injectable } from '@nestjs/common';
import { StripeAdapter } from './adapters/stripe.adapter';
import { CheckoutInput, PaymentProvider } from './interfaces/payment-provider';

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

@Injectable()
export class PaymentsService {
  constructor(@Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider) {}

  checkout(input: CheckoutInput) {
    return this.provider.createCheckout(input);
  }
}
