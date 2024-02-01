import { Module } from '@nestjs/common';
import { ChattingController } from './chatting.controller';
import { ChattingService } from './chatting.service';
import { CommonModule } from 'apps/common/src/common.module';
import { ChattingGateway } from './chatting.gateway';

@Module({
  imports: [CommonModule],
  controllers: [ChattingController],
  providers: [ChattingService, ChattingGateway],
})
export class ChattingModule {}
