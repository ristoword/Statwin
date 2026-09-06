import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

@Injectable()
export class SchedulerTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ai.schedulerToken') ?? '';
    if (!expected) {
      throw new UnauthorizedException('AI_SCHEDULER_TOKEN non configurato');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers['x-ai-scheduler-token'];
    const bearer = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    const query = typeof request.query.token === 'string' ? request.query.token : undefined;
    const provided = firstString(header) || bearer || query || '';

    if (!safeEqual(provided, expected)) {
      throw new UnauthorizedException('Token scheduler AI non valido');
    }
    return true;
  }
}

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function safeEqual(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
