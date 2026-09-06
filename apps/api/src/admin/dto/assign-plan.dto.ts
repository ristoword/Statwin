import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';
import { IsIn } from 'class-validator';

export class AssignPlanDto {
  @ApiProperty({ enum: ['FREE', 'PREMIUM', 'PRO'] })
  @IsIn(['FREE', 'PREMIUM', 'PRO'])
  plan!: SubscriptionPlan;
}
