import { Controller, Get } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller()
export class ApiController {
  constructor(private readonly chattingApiService: ApiService) {}

  @Get()
  getHello(): string {
    return this.chattingApiService.getHello();
  }
}
