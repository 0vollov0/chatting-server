import { Module } from '@nestjs/common';
import { ChatRoomsService } from './chat-rooms.service';
import {
  ChatRoom,
  ChatRoomSchema,
} from 'apps/common/src/schemas/chat-room.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'apps/api/src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ChatRoom.name,
        schema: ChatRoomSchema,
      },
    ]),
    UsersModule,
  ],
  providers: [ChatRoomsService],
  exports: [ChatRoomsService],
})
export class ChatRoomsModule {}
