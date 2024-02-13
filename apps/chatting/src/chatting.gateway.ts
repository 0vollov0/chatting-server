import { UseFilters } from '@nestjs/common';
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
import { ChattingService } from './chatting.service';
import { SendChatWithFileDto } from './dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from './dto/send-chat-with-image.dto';

@WebSocketGateway(+process.env.SOCKET_PORT || 8081, {
  cors: {
    origin: '*',
    methods: ['GET'],
    credentials: true,
  },
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
})
export class ChattingGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private clients: Map<string, Socket>;

  constructor(private readonly chattingService: ChattingService) {
    this.clients = new Map<string, Socket>();
  }
  afterInit(server: Server) {
    this.chattingService.server = server;
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
    @MessageBody(SendChatValidation)
    dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto,
  ) {
    this.chattingService.handleChat(dto);
  }
}
