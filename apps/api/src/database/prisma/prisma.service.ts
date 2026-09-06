import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.warn(
        'PostgreSQL non disponibile. Avvio in modalità degradata. Avvia Docker: docker compose up -d postgres redis',
      );
      this.logger.debug(String(error));
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
