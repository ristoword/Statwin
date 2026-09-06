import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { PrismaService } from '../database/prisma/prisma.service';
import { REDIS } from '../database/redis/redis.module';

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    let database = 'down';
    let cache = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }
    try {
      const pong = await this.redis.ping();
      cache = pong === 'PONG' ? 'up' : 'down';
    } catch {
      cache = 'down';
    }
    return {
      status: database === 'up' && cache === 'up' ? 'ok' : 'degraded',
      service: 'statwin-api',
      timestamp: new Date().toISOString(),
      checks: { database, redis: cache },
    };
  }
}
