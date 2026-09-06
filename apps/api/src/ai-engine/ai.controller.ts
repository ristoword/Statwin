import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';
import { AiEngineService } from './ai-engine.service';

class AnalyzeDto {
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}

@ApiTags('ai')
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly ai: AiEngineService) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeDto) {
    const report = await this.ai.analyzeMatch(dto.context ?? {});
    return { layer: 'AI_ANALYSIS', ...report };
  }
}
