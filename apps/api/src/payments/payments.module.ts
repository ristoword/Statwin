import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PaymentsController } from './payments.controller';
import { PAYMENT_PROVIDER, PaymentsService } from './payments.service';
import { StripeAdapter } from './adapters/stripe.adapter';

@Module({
  imports: [SubscriptionsModule],
  controllers: [PaymentsController],
  providers: [
    StripeAdapter,
    PaymentsService,
    { provide: PAYMENT_PROVIDER, useExisting: StripeAdapter },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
