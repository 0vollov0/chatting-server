import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { CommonModule } from 'apps/common/src/common.module';
import { SocketGateway } from './socket.gateway';
import { ChatRoomsModule } from '../../common/src/chat-rooms/chat-rooms.module';
import { UsersModule } from 'apps/api/src/users/users.module';
import { GrpcModule } from './grpc/grpc.module';
import { GrpcService } from './grpc/grpc.service';

@Module({
  imports: [CommonModule, ChatRoomsModule, UsersModule, GrpcModule],
  providers: [SocketService, SocketGateway, GrpcService],
})
export class SocketModule {}
