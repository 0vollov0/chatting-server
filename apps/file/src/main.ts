import { NestFactory } from '@nestjs/core';
import { FileModule } from './file.module';
import * as fs from 'fs';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';

async function bootstrap() {
  const rootPath = join(__dirname, '../../..', 'bucket');
  if (!fs.existsSync(rootPath)) {
    fs.mkdirSync(rootPath);
    console.log(`${rootPath} has been created.`);
  } else {
    console.log(`${rootPath} is already exist.`);
  }
  const filePath = join(rootPath, 'file');
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
    console.log(`${filePath} has been created.`);
  } else {
    console.log(`${filePath} is already exist.`);
  }

  const imagePath = join(rootPath, 'image');
  if (!fs.existsSync(imagePath)) {
    fs.mkdirSync(imagePath);
    console.log(`${imagePath} has been created.`);
  } else {
    console.log(`${imagePath} is already exist.`);
  }

  const app = await NestFactory.create(FileModule);
  app.use(json({ limit: '100mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.listen(process.env.FILE_PORT);
}
bootstrap();
