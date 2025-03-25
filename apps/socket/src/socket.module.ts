import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { CommonModule } from '@common/common.module';
import { SocketGateway } from './socket.gateway';
import { ChatRoomsModule } from '../../common/src/chat-rooms/chat-rooms.module';
import { UsersModule } from 'apps/api/src/users/users.module';
import { GrpcModule } from './grpc/grpc.module';
import { GrpcService } from './grpc/grpc.service';
import { ChatRoom, ChatRoomSchema } from '@common/schemas/chat-room.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    CommonModule,
    ChatRoomsModule,
    UsersModule,
    GrpcModule,
    MongooseModule.forFeature([
      {
        name: ChatRoom.name,
        schema: ChatRoomSchema,
      },
    ]),
  ],
  providers: [SocketService, SocketGateway, GrpcService],
})
export class SocketModule {}
