import { Module } from '@nestjs/common';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';
import { TheSportsDbTvClient } from './thesportsdb-tv.client';

@Module({
  controllers: [LiveController],
  providers: [LiveService, TheSportsDbTvClient],
  exports: [LiveService],
})
export class LiveModule {}
