import { UseFilters, UseInterceptors } from '@nestjs/common';
import {
  ConnectedSocket,
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
import { JoinRoomDto } from './dto/join-room.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateRoomValidation } from './pipes/create-room.validation';
import { JoinRoomValidation } from './pipes/join-room.validation';
import { ExitRoomDto } from './dto/exit-room.dto';
import { ExitRoomValidation } from './pipes/exit-room.validation';

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

  constructor(
    private readonly chattingService: SocketService,
    private readonly socketService: SocketService,
  ) {
    this.clients = new Map<string, Socket>();
  }
  afterInit(server: Server) {
    this.chattingService.server = server;
  }

  handleConnection(client: Socket) {
    try {
      if (
        typeof client.handshake.auth.name === 'string' &&
        client.handshake.auth.name.length > 1 &&
        !this.clients.has(client.handshake.auth.name)
      ) {
        this.clients.set(client.handshake.auth.name, client);
      } else {
        client.disconnect(true);
      }
    } catch (error) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.handshake.auth.name);
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

  @UseFilters(SocketExceptionFilter)
  @SubscribeMessage('create-room')
  createRoom(
    @MessageBody(CreateRoomValidation) dto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.socketService.createRoom(client, dto);
  }

  @UseFilters(SocketExceptionFilter)
  @SubscribeMessage('join-room')
  joinRoom(
    @MessageBody(JoinRoomValidation) dto: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.socketService.joinRoom(client, dto);
  }

  @UseFilters(SocketExceptionFilter)
  @SubscribeMessage('exit-room')
  exitRoom(
    @MessageBody(ExitRoomValidation) dto: ExitRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.socketService.exitRoom(client, dto);
  }
}
