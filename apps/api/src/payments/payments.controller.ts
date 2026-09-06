import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsUrl } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.constants';
import { requestMeta } from '../audit/request-meta';
import type { Request } from 'express';

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
  constructor(
    private readonly payments: PaymentsService,
    private readonly audit: AuditService,
  ) {}

  @Post('checkout')
  async checkout(
    @CurrentUser() user: { id: string },
    @Body() dto: CheckoutDto,
    @Req() req: Request,
  ) {
    const result = await this.payments.checkout({ userId: user.id, ...dto });
    await this.audit.record({
      action: AuditAction.FEATURE_CHECKOUT,
      userId: user.id,
      actorId: user.id,
      metadata: { plan: dto.plan },
      ...requestMeta(req),
    });
    return result;
  }
}
