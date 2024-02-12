import { Module } from '@nestjs/common';
import { ChattingService } from './chatting.service';
import { CommonModule } from 'apps/common/src/common.module';
import { ChattingGateway } from './chatting.gateway';

@Module({
  imports: [CommonModule],
  providers: [ChattingService, ChattingGateway],
})
export class ChattingModule {}
