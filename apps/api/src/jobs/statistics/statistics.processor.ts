import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

@Processor('statistics')
export class StatisticsProcessor extends WorkerHost {
  private readonly logger = new Logger(StatisticsProcessor.name);

  async process() {
    this.logger.log('Statistics recompute queued — nessun dato sportivo inventato');
    return { recomputed: 0 };
  }
}
