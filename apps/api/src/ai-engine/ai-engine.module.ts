import { Module } from '@nestjs/common';
import { OpenAIProvider } from './providers/openai.provider';
import { AI_PROVIDER, AiEngineService } from './ai-engine.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [
    OpenAIProvider,
    AiEngineService,
    { provide: AI_PROVIDER, useExisting: OpenAIProvider },
  ],
  exports: [AiEngineService],
})
export class AiEngineModule {}
