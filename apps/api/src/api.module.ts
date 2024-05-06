import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from '@common/common.module';
import { ChatRoomsModule } from './chat-rooms/chat-rooms.module';

@Module({
  imports: [CommonModule, UsersModule, AuthModule, ChatRoomsModule],
})
export class ApiModule {}
