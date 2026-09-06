import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AppRole } from '../common/enums/roles.enum';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../database/prisma/prisma.service';
import { AdminService } from './admin.service';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionPlan } from '@prisma/client';

class AssignPlanDto {
  @IsIn(['FREE', 'PREMIUM', 'PRO'])
  plan!: SubscriptionPlan;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly admin: AdminService,
    private readonly ai: AiEngineService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  @Get('users')
  usersList() {
    return this.users.list();
  }

  @Patch('users/:id/plan')
  assignPlan(@Param('id') id: string, @Body() dto: AssignPlanDto) {
    return this.subscriptions.activate(id, dto.plan);
  }

  @Get('subscriptions')
  subscriptionsList() {
    return this.admin.subscriptions();
  }

  @Get('payments')
  paymentsList() {
    return this.admin.payments();
  }

  @Get('overview')
  async overview() {
    const [users, subscriptions, sports, jobs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.groupBy({ by: ['plan'], _count: true }),
      this.prisma.sport.findMany(),
      Promise.resolve({
        sync: 'idle',
        statistics: 'idle',
        odds: 'idle',
        aiReports: 'idle',
      }),
    ]);
    return { users, subscriptions, sports, jobs };
  }

  @Get('ai-reports')
  aiReports() {
    return this.admin.aiReports();
  }

  @Post('ai-reports/generate')
  generateAiReports() {
    return this.ai.generateDueReports({ limit: 8 });
  }
}
