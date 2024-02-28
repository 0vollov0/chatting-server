import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { CommonModule } from 'apps/common/src/common.module';
import { SocketGateway } from './socket.gateway';
@Module({
  imports: [CommonModule],
  providers: [SocketService, SocketGateway],
})
export class SocketModule {}
