import { Controller, Get } from '@nestjs/common';
import { ChattingApiService } from './chatting-api.service';

@Controller()
export class ChattingApiController {
  constructor(private readonly chattingApiService: ChattingApiService) {}

  @Get()
  getHello(): string {
    return this.chattingApiService.getHello();
  }
}
