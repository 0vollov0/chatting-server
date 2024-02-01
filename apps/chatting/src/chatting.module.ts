import { Module } from '@nestjs/common';
import { ChattingController } from './chatting.controller';
import { ChattingService } from './chatting.service';

@Module({
  imports: [],
  controllers: [ChattingController],
  providers: [ChattingService],
})
export class ChattingModule {}
