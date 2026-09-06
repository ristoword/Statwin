import { Injectable } from '@nestjs/common';

@Injectable()
export class JobsService {
  queues() {
    return ['sync', 'statistics', 'odds', 'ai-reports'] as const;
  }
}
