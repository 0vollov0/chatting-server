import { NestFactory } from '@nestjs/core';
import { ChattingApiModule } from './chatting-api.module';

async function bootstrap() {
  const app = await NestFactory.create(ChattingApiModule);
  await app.listen(3000);
}
bootstrap();
