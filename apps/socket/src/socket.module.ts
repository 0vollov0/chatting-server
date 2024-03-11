import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { CommonModule } from 'apps/common/src/common.module';
import { SocketGateway } from './socket.gateway';
import { ChatRoomsModule } from '../../common/src/chat-rooms/chat-rooms.module';
import { UsersModule } from 'apps/api/src/users/users.module';

@Module({
  imports: [CommonModule, ChatRoomsModule, UsersModule],
  providers: [SocketService, SocketGateway],
})
export class SocketModule {}
