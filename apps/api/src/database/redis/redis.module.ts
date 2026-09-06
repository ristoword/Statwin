import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS');

function createRedis(config: ConfigService): Redis {
  const url = config.get<string>('redis.url');
  const common = {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    retryStrategy: () => null,
  } as const;

  if (url) {
    return new Redis(url, common);
  }

  return new Redis({
    host: config.get<string>('redis.host'),
    port: config.get<number>('redis.port'),
    username: config.get<string>('redis.username'),
    password: config.get<string>('redis.password') || undefined,
    tls: config.get('redis.tls'),
    ...common,
  });
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: createRedis,
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
