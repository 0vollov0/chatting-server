import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { CommonModule } from 'apps/common/src/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'apps/common/src/schemas/chat.schema';

@Module({
  imports: [
    CommonModule,
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
