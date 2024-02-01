import { NestFactory } from '@nestjs/core';
import { ChattingModule } from './chatting.module';

async function bootstrap() {
  const app = await NestFactory.create(ChattingModule);
  await app.listen(3000);
}
bootstrap();
