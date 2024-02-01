import { Injectable } from '@nestjs/common';

@Injectable()
export class ChattingApiService {
  getHello(): string {
    return 'Hello World!';
  }
}
