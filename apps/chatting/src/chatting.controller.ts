import { Controller, Get } from '@nestjs/common';
import { ChattingService } from './chatting.service';

@Controller()
export class ChattingController {
  constructor(private readonly chattingService: ChattingService) {}

  @Get()
  getHello(): string {
    return this.chattingService.getHello();
  }
}
