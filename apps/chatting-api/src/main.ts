import { NestFactory } from '@nestjs/core';
import { ChattingApiModule } from './chatting-api.module';

async function bootstrap() {
  const app = await NestFactory.create(ChattingApiModule);
  await app.listen(process.env.CHATTING_HTTP_PORT);
}
bootstrap();
