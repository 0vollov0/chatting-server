import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from 'apps/common/src/common.module';
import { ChatRoomsModule } from './chat-rooms/chat-rooms.module';

@Module({
  imports: [CommonModule, UsersModule, AuthModule, ChatRoomsModule],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
