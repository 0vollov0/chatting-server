import { NestFactory } from '@nestjs/core';
import { FileModule } from './file.module';
import * as fs from 'fs';
import { join } from 'path';

async function bootstrap() {
  const rootPath = join(__dirname, '../../..', 'bucket');
  if (!fs.existsSync(rootPath)) {
    fs.mkdirSync(rootPath);
    console.log(`${rootPath} has been created.`);
  } else {
    console.log(`${rootPath} is already exist.`);
  }
  const app = await NestFactory.create(FileModule);
  await app.listen(process.env.FILE_PORT);
}
bootstrap();
