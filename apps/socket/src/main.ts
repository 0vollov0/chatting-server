import { NestFactory } from '@nestjs/core';
import { SocketModule } from './socket.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(SocketModule, {
    logger: ['debug', 'error', 'warn', 'log'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.listen(9090);
}
bootstrap();
