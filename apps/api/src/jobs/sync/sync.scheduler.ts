import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class SyncScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(SyncScheduler.name);

  constructor(
    @InjectQueue('sync') private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap() {
    void this.registerRepeatableJob();
  }

  private async registerRepeatableJob() {
    const intervalMs = Number(this.config.get('sportsSync.intervalMs') ?? 6 * 60 * 60 * 1000);
    try {
      await withTimeout((async () => {
        const repeatable = await this.queue.getRepeatableJobs();
        for (const job of repeatable) {
          if (job.name === 'all-sports') {
            await this.queue.removeRepeatableByKey(job.key);
          }
        }
        await this.queue.add(
          'all-sports',
          {},
          {
            repeat: { every: Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 6 * 60 * 60 * 1000 },
            removeOnComplete: 20,
            removeOnFail: 50,
          },
        );
      })(), 4000);
      this.logger.log(`Sync periodico all-sports ogni ${intervalMs}ms`);
    } catch (error) {
      this.logger.warn(
        `Sync periodico non attivo (Redis assente?): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
