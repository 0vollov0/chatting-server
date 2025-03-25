import {
  UnauthorizedException,
  UseFilters,
  UseGuards,
  Logger,
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
import { UsersService } from '@api/users/users.service';
import { UserExistAuthGuard } from './guards/user-exist-auth.guard';
import { ChatRoomsService } from '@common/chat-rooms/chat-rooms.service';

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
  private readonly logger = new Logger(SocketGateway.name);
  private _clients: Map<string, Socket>;

  constructor(
    private readonly socketService: SocketService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly chatRoomsService: ChatRoomsService,
  ) {
    this._clients = new Map<string, Socket>();
  }

  afterInit(server: Server) {
    this.socketService.setServer(server);
    this.logger.log('Socket server initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const accessToken = client.handshake.auth.accessToken;
      if (!accessToken) {
        throw new UnauthorizedException('Access token is missing');
      }

      let payload: TUserPayload;
      try {
        payload = jwt.verify(
          accessToken,
          this.configService.get<string>('JWT_SECRET'),
          { ignoreExpiration: false },
        ) as TUserPayload;
      } catch (error) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const user = await this.usersService.findById(payload._id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      client.handshake.auth._id = payload._id;
      this._clients.set(payload._id, client);

      const rooms = await this.chatRoomsService.findRoomsParticipated(
        payload._id,
      );
      rooms.forEach(({ _id }) => client.join(_id.toString()));

      this.logger.log(`Client connected: ${payload._id}`);
    } catch (error) {
      this.logger.warn(`Client connection failed: ${error.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth?._id;
    if (userId) {
      this._clients.delete(userId);
      this.logger.log(`Client disconnected: ${userId}`);
    } else {
      this.logger.warn('Client disconnected without valid user ID');
    }
    client.disconnect(true);
  }

  public get clients(): Map<string, Socket> {
    return this._clients;
  }

  @WebSocketServer()
  server: Server;

  @UseGuards(JwtAuthGuard)
  @UseFilters(SocketExceptionFilter)
  @SubscribeMessage('chat')
  handleChat(
    @MessageBody(SendChatValidation)
    dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto,
  ) {
    return this.socketService.handleChat(dto);
  }

  @UseGuards(UserExistAuthGuard)
  @UseFilters(SocketExceptionFilter)
  @SubscribeMessage('create-room')
  createRoom(
    @MessageBody(CreateRoomValidation) dto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.socketService.createRoom(client, dto);
  }

  @UseGuards(UserExistAuthGuard)
  @UseFilters(SocketExceptionFilter)
  @SubscribeMessage('join-room')
  joinRoom(
    @MessageBody(JoinRoomValidation) dto: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.socketService.joinRoom(client, dto);
  }

  @UseFilters(SocketExceptionFilter)
  @SubscribeMessage('exit-room')
  exitRoom(
    @MessageBody(ExitRoomValidation) dto: ExitRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.socketService.exitRoom(client, dto);
  }
}
