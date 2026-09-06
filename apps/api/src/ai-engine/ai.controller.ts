import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AiEngineService } from './ai-engine.service';
import { SchedulerTokenGuard } from './scheduler.guard';

class AnalyzeDto {
  @IsOptional()
  @IsString()
  matchId?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

@ApiTags('ai')
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly ai: AiEngineService) {}

  @Get('status')
  status() {
    return this.ai.status();
  }

  @Get('reports')
  reports() {
    return this.ai.listReports();
  }

  @Get('matches/:id')
  matchLayers(@Param('id') id: string) {
    return this.ai.layers(id);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('analyze')
  async analyze(@Body() dto: AnalyzeDto) {
    if (dto.matchId) {
      return this.ai.analyzeStoredMatch(dto.matchId, { force: dto.force });
    }
    const report = await this.ai.analyzeMatch(dto.context ?? {});
    return { layer: 'AI_ANALYSIS', reused: false, ...report };
  }

  @Post('jobs/run')
  @UseGuards(SchedulerTokenGuard)
  runJob() {
    return this.ai.generateDueReports({ limit: 8 });
  }
}
