import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

@Processor('ai-reports')
export class AiReportsProcessor extends WorkerHost {
  private readonly logger = new Logger(AiReportsProcessor.name);

  async process() {
    this.logger.log('AI report job queued — nessuna invenzione di dati');
    return { generated: 0 };
  }
}
