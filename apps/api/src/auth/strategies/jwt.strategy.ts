import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { effectivePlan } from '../../subscriptions/plan-limits';

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('app.jwtSecret') ?? 'change-me-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    const trialEndsAt = user.subscription?.trialEndsAt ?? null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: effectivePlan(user.subscription?.plan, trialEndsAt),
      storedPlan: user.subscription?.plan ?? 'FREE',
      trialEndsAt,
    };
  }
}
