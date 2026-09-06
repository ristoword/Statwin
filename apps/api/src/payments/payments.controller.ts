import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsUrl } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

class CheckoutDto {
  @IsIn(['PREMIUM', 'PRO'])
  plan!: 'PREMIUM' | 'PRO';

  @IsUrl({ require_tld: false })
  successUrl!: string;

  @IsUrl({ require_tld: false })
  cancelUrl!: string;
}

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('checkout')
  checkout(@CurrentUser() user: { id: string }, @Body() dto: CheckoutDto) {
    return this.payments.checkout({ userId: user.id, ...dto });
  }
}
