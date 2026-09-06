import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

@Processor('odds')
export class OddsProcessor extends WorkerHost {
  private readonly logger = new Logger(OddsProcessor.name);

  async process() {
    this.logger.log('Odds sync queued — adapter noop');
    return { imported: 0 };
  }
}
