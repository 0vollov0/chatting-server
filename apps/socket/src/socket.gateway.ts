import { UseFilters, UseInterceptors } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SocketExceptionFilter } from './filters/socket-exception.filter';
import { SendChatDto } from './dto/send-chat.dto';
import { SendChatValidation } from './pipes/send-chat.validation';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';
import { SendChatWithFileDto } from './dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from './dto/send-chat-with-image.dto';
import { SendChatInterceptor } from './interceptors/send-chat.interceptor';

@WebSocketGateway(+process.env.SOCKET_PORT || 8081, {
  cors: {
    origin: '*',
    methods: ['GET'],
    credentials: true,
  },
  maxHttpBufferSize: 10 * 10 ** 6, // 10MB
})
export class SocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private clients: Map<string, Socket>;

  constructor(private readonly chattingService: SocketService) {
    this.clients = new Map<string, Socket>();
  }
  afterInit(server: Server) {
    this.chattingService.server = server;
  }

  handleConnection(client: Socket) {
    try {
      if (
        typeof client.handshake.auth.name === 'string' &&
        client.handshake.auth.name.length > 1
      ) {
        this.clients.set(client.id, client);
      } else {
        client.disconnect(true);
      }
    } catch (error) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
    client.disconnect(true);
  }

  @WebSocketServer()
  server: Server;

  @UseInterceptors(SendChatInterceptor)
  @UseFilters(SocketExceptionFilter)
  @SubscribeMessage('chat')
  handleChat(
    @MessageBody(SendChatValidation)
    dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto,
  ) {
    this.chattingService.handleChat(dto);
  }
}
