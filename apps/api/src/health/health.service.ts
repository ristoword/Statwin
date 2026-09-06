import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../database/prisma/prisma.service';
import { REDIS } from '../database/redis/redis.module';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async check() {
    let database = 'down';
    let redis = 'down';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    try {
      redis = (await this.redis.ping()) === 'PONG' ? 'up' : 'down';
    } catch {
      redis = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      service: 'statwin-api',
      timestamp: new Date().toISOString(),
      checks: { database, redis },
    };
  }
}
