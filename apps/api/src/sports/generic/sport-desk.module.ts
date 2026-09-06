import { Module } from '@nestjs/common';
import { SportDeskService } from './sport-desk.service';

@Module({
  providers: [SportDeskService],
  exports: [SportDeskService],
})
export class SportDeskModule {}
