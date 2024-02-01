import { Module } from '@nestjs/common';
import { ChattingApiController } from './chatting-api.controller';
import { ChattingApiService } from './chatting-api.service';

@Module({
  imports: [],
  controllers: [ChattingApiController],
  providers: [ChattingApiService],
})
export class ChattingApiModule {}
