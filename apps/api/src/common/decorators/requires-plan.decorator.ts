import { SetMetadata } from '@nestjs/common';
import { PLANS_KEY } from '../guards/plan.guard';

export const RequiresPlan = (...plans: string[]) => SetMetadata(PLANS_KEY, plans);
