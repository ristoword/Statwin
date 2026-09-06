import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PAYMENT_PROVIDER, PaymentsService } from './payments.service';
import { StripeAdapter } from './adapters/stripe.adapter';

@Module({
  controllers: [PaymentsController],
  providers: [
    StripeAdapter,
    PaymentsService,
    { provide: PAYMENT_PROVIDER, useExisting: StripeAdapter },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
