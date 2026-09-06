import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SportsSyncCoordinator } from '../../sports/generic/sports-sync.coordinator';
import { FootballSyncService } from '../../sports/football/football-sync.service';

@Processor('sync')
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private readonly sportsSync: SportsSyncCoordinator,
    private readonly footballSync: FootballSyncService,
  ) {
    super();
  }

  async process(job: Job) {
    const name = (job.name ?? 'all-sports').toLowerCase();
    this.logger.log(`Sync job ${job.name}`);
    if (name === 'football' || name === 'calcio') {
      return this.footballSync.syncAll();
    }
    if (name === 'all-sports' || name === 'sports' || name === 'sync') {
      const only = Array.isArray(job.data?.sports) ? job.data.sports : undefined;
      return this.sportsSync.syncAll(only);
    }
    return this.sportsSync.syncAll([name]);
  }
}
