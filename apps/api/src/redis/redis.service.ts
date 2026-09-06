import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.get<string>('redis.host'),
      port: config.get<number>('redis.port'),
      password: config.get<string>('redis.password') || undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }

  async connect(): Promise<void> {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.connect();
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
