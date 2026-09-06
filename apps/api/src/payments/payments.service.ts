import { Inject, Injectable } from '@nestjs/common';
import { PaymentStatus, SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PLAN_PRICES_CENTS } from '../subscriptions/plan-limits';
import { CheckoutInput, PaymentProvider } from './interfaces/payment-provider';

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async checkout(input: CheckoutInput) {
    const session = await this.provider.createCheckout(input);
    const plan = input.plan as SubscriptionPlan;
    const payment = await this.prisma.payment.create({
      data: {
        userId: input.userId,
        amountCents: PLAN_PRICES_CENTS[plan],
        currency: 'eur',
        status: PaymentStatus.SUCCEEDED,
        plan,
      },
    });
    const subscription = await this.subscriptions.activate(input.userId, plan);
    return {
      ...session,
      activated: true,
      plan,
      paymentId: payment.id,
      subscription,
    };
  }
}
