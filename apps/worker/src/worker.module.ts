import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';

@Module({
  providers: [WorkerService],
})
export class WorkerModule {}
