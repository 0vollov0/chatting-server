import { UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SocketExceptionFilter } from './filters/socket-exception.filter';
import { SendChatDto } from './dto/send-chat.dto';
import { SendChatValidation } from './pipes/send-chat.validation';
import { Server, Socket } from 'socket.io';
import { ChattingService } from './chatting.service';

@WebSocketGateway(+process.env.SOCKET_PORT || 8081, {
  cors: {
    origin: '*',
    methods: ['GET'],
    credentials: true,
  },
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
})
export class ChattingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private clients: Map<string, Socket>;

  constructor(private readonly chattingService: ChattingService) {
    this.clients = new Map<string, Socket>();
  }

  handleConnection(client: Socket) {
    this.clients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
    client.disconnect(true);
  }

  @WebSocketServer()
  server: Server;

  @UseFilters(SocketExceptionFilter)
  @SubscribeMessage('chat')
  handleChat(
    @MessageBody(SendChatValidation) dto: SendChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    client.emit('chat', dto);
  }
}
