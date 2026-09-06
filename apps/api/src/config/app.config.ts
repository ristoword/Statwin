import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3002',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION ?? '15m',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '30d',
}));
