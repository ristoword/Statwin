import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppRole } from '../common/enums/roles.enum';
import { AdminService } from './admin.service';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { requestMeta } from '../audit/request-meta';
import { CreateAdminUserDto } from './dto/create-user.dto';
import { UpdateAdminUserDto } from './dto/update-user.dto';
import { AssignPlanDto } from './dto/assign-plan.dto';
import { AuditQueryDto } from './dto/audit-query.dto';
import { UsersQueryDto } from './dto/users-query.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly ai: AiEngineService,
  ) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('users')
  usersList(@Query() query: UsersQueryDto) {
    return this.admin.listUsers(query);
  }

  @Post('users')
  createUser(
    @Body() dto: CreateAdminUserDto,
    @CurrentUser() actor: { id: string },
    @Req() req: Request,
  ) {
    return this.admin.createUser(dto, actor, requestMeta(req));
  }

  @Get('users/:id')
  userDetail(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentUser() actor: { id: string },
    @Req() req: Request,
  ) {
    return this.admin.updateUser(id, dto, actor, requestMeta(req));
  }

  @Patch('users/:id/plan')
  assignPlan(
    @Param('id') id: string,
    @Body() dto: AssignPlanDto,
    @CurrentUser() actor: { id: string },
    @Req() req: Request,
  ) {
    return this.admin.assignPlan(id, dto.plan, actor, requestMeta(req));
  }

  @Post('users/:id/block')
  blockUser(
    @Param('id') id: string,
    @CurrentUser() actor: { id: string },
    @Req() req: Request,
  ) {
    return this.admin.setBlocked(id, true, actor, requestMeta(req));
  }

  @Post('users/:id/unblock')
  unblockUser(
    @Param('id') id: string,
    @CurrentUser() actor: { id: string },
    @Req() req: Request,
  ) {
    return this.admin.setBlocked(id, false, actor, requestMeta(req));
  }

  @Post('users/:id/password')
  regeneratePassword(
    @Param('id') id: string,
    @CurrentUser() actor: { id: string },
    @Req() req: Request,
  ) {
    return this.admin.regeneratePassword(id, actor, requestMeta(req));
  }

  @Get('users/:id/access')
  userAccess(@Param('id') id: string, @Query() query: AuditQueryDto) {
    return this.admin.listAccess(id, query);
  }

  @Get('audit')
  audit(@Query() query: AuditQueryDto) {
    return this.admin.listAudit(query);
  }

  @Get('subscriptions')
  subscriptionsList() {
    return this.admin.listSubscriptions();
  }

  @Get('payments')
  paymentsList() {
    return this.admin.listPayments();
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
