import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';
import type { RequestMeta } from './request-meta';

export type AuditRecordInput = RequestMeta & {
  action: string;
  userId?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditRecordInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: input.action,
          userId: input.userId ?? undefined,
          actorId: input.actorId ?? undefined,
          ip: input.ip,
          userAgent: input.userAgent,
          path: input.path,
          metadata: input.metadata as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      this.logger.warn(`Scrittura audit non riuscita (${input.action})`);
      this.logger.debug(error instanceof Error ? error.message : String(error));
    }
  }
}
