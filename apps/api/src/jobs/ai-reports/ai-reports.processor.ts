import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { AiEngineService } from '../../ai-engine/ai-engine.service';

@Processor('ai-reports')
export class AiReportsProcessor extends WorkerHost {
  private readonly logger = new Logger(AiReportsProcessor.name);

  constructor(private readonly ai: AiEngineService) {
    super();
  }

  async process() {
    this.logger.log('AI report job — solo dati già in archivio');
    return this.ai.generateDueReports({ limit: 8 });
  }
}
