import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  await app.listen(process.env.CHATTING_HTTP_PORT);
}
bootstrap();
