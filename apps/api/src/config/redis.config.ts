import { registerAs } from '@nestjs/config';

function fromRedisUrl(raw: string) {
  const parsed = new URL(raw);
  return {
    url: raw,
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: decodeURIComponent(parsed.username || '') || undefined,
    password: decodeURIComponent(parsed.password || '') || undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
  };
}

export default registerAs('redis', () => {
  const url = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL || '';
  if (url) {
    try {
      return fromRedisUrl(url);
    } catch {
      /* fall through to host/port */
    }
  }

  return {
    url: undefined,
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    username: undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: undefined,
  };
});
