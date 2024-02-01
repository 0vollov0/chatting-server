import { Module } from '@nestjs/common';
import { ChattingController } from './chatting.controller';
import { ChattingService } from './chatting.service';
import { CommonModule } from 'apps/common/src/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ChattingController],
  providers: [ChattingService],
})
export class ChattingModule {}
