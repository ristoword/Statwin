import { Inject, Injectable } from '@nestjs/common';
import { AIContext, AIProvider } from './providers/ai-provider';

export const AI_PROVIDER = Symbol('AI_PROVIDER');

@Injectable()
export class AiEngineService {
  constructor(@Inject(AI_PROVIDER) private readonly provider: AIProvider) {}

  analyzeMatch(context: AIContext) {
    return this.provider.analyzeMatch(context);
  }
}
