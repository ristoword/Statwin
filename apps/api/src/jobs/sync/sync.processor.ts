import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FootballSyncService } from '../../sports/football/football-sync.service';

@Processor('sync')
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(private readonly footballSync: FootballSyncService) {
    super();
  }

  async process(job: Job) {
    this.logger.log(`Sync job ${job.name} via OpenLigaDB`);
    return this.footballSync.syncAll();
  }
}
