import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AiEngineModule } from '../ai-engine/ai-engine.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule, AiEngineModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
