import {
  UnauthorizedException,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
import { ConfigService } from '@nestjs/config';
import { TUserPayload } from 'apps/api/src/users/decorators/user.decorator';
import * as jwt from 'jsonwebtoken';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from 'apps/api/src/users/users.service';
import { UserExistAuthGuard } from './guards/user-exist-auth.guard';

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
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.clients = new Map<string, Socket>();
  }
  afterInit(server: Server) {
    this.chattingService.server = server;
  }

  async handleConnection(client: Socket) {
    try {
      const payload = jwt.verify(
        client.handshake.auth.accessToken,
        this.configService.get<string>('JWT_SECRET'),
        {
          ignoreExpiration: false,
        },
      ) as TUserPayload;
      const user = await this.usersService.findById(payload._id);
      if (!user) throw new UnauthorizedException();
      client.handshake.auth._id = payload._id;
      this.clients.set(client.handshake.auth._id, client);
    } catch (error) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.handshake.auth._id);
    client.disconnect(true);
  }

  @WebSocketServer()
  server: Server;

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(SendChatInterceptor)
  @UseFilters(SocketExceptionFilter)
  @SubscribeMessage('chat')
  handleChat(
    @MessageBody(SendChatValidation)
    dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto,
  ) {
    this.chattingService.handleChat(dto);
  }

  @UseGuards(UserExistAuthGuard)
  @UseFilters(SocketExceptionFilter)
  @SubscribeMessage('create-room')
  createRoom(
    @MessageBody(CreateRoomValidation) dto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.socketService.createRoom(client, dto);
  }

  @UseGuards(UserExistAuthGuard)
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
