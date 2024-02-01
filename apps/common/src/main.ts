import { NestFactory } from '@nestjs/core';
import { CommonModule } from './common.module';

async function bootstrap() {
  const app = await NestFactory.create(CommonModule);
  await app.listen(3000);
}
bootstrap();
