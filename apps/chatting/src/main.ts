import { NestFactory } from '@nestjs/core';
import { ChattingModule } from './chatting.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ChattingModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.listen(9090);
}
bootstrap();
