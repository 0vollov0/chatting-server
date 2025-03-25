import { NestFactory } from '@nestjs/core';
import { FileModule } from './file.module';
import * as fs from 'fs';
import { join } from 'path';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as serveIndex from 'serve-index';

async function bootstrap() {
  const rootPath = join(__dirname, '../../..', 'bucket');
  const filePath = join(rootPath, 'file');
  const imagePath = join(rootPath, 'image');
  const paths = [rootPath, filePath, imagePath];
  paths.forEach((path) => {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
      Logger.log(`${path} has been created.`, 'NestApplication');
    } else {
      Logger.log(`${path} is already exist.`, 'NestApplication');
    }
  });
  const app = await NestFactory.create(FileModule, {
    logger: ['error', 'warn'],
  });
  app.enableCors({
    origin: '*',
    credentials: true,
  });
  app.use(
    '/bucket',
    express.static(rootPath),
    serveIndex(rootPath, { icons: true }),
  );
  app.use(express.json({ limit: '100mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.listen(process.env.FILE_PORT);
}
bootstrap();
