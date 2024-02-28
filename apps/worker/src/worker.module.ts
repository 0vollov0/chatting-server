import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from 'apps/common/src/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChatRoom,
  ChatRoomSchema,
} from 'apps/common/src/schemas/chat-room.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CommonModule,
    MongooseModule.forFeature([
      {
        name: ChatRoom.name,
        schema: ChatRoomSchema,
      },
    ]),
  ],
  providers: [WorkerService],
})
export class WorkerModule {}
