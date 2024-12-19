import { NestFactory } from '@nestjs/core';
import { CommonModule } from './common.module';

async function bootstrap() {
  const app = await NestFactory.create(CommonModule, {
    logger: ['error', 'warn', 'log'],
  });
  await app.listen(3000);
}
bootstrap();
