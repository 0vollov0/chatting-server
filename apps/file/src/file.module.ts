import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { CommonModule } from 'apps/common/src/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'apps/common/src/schemas/chat.schema';
import { GrpcModule } from './grpc/grpc.module';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Chat.name,
        schema: ChatSchema,
      },
    ]),
    GrpcModule,
  ],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
