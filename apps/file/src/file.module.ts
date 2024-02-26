import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CommonModule } from 'apps/common/src/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'apps/common/src/schemas/chat.schema';

@Module({
  imports: [
    CommonModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../..', 'bucket'),
      serveStaticOptions: {
        cacheControl: true,
        maxAge: 1000 * 60,
      },
    }),
    MongooseModule.forFeature([
      {
        name: Chat.name,
        schema: ChatSchema,
      },
    ]),
  ],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
