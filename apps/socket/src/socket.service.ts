import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SendChatWithFileDto } from './dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from './dto/send-chat-with-image.dto';
import { SendChatDto } from './dto/send-chat.dto';
import { ChatFactory } from './factories/chat-factory';
import { RedisService } from 'apps/common/src/redis/redis.service';
import { ChatRoomsService } from 'apps/common/src/chat-rooms/chat-rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { WsException } from '@nestjs/websockets';
import { ExitRoomDto } from './dto/exit-room.dto';

@Injectable()
export class SocketService {
  private _server: Server;
  constructor(
    private readonly redisService: RedisService,
    private readonly chatRoomsService: ChatRoomsService,
  ) {}

  public set server(server: Server) {
    this._server = server;
  }

  public get server(): Server {
    return this._server;
  }

  async handleChat(
    dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto,
  ) {
    try {
      const chatFactory = new ChatFactory(dto);
      const chat = await chatFactory.process();
      this.redisService.appendChat(`${dto.roomId}`, chat).then(() => {
        this._server.to(dto.roomId).emit('chat', chat);
      });
    } catch (error) {
      throw new WsException(error);
    }
  }

  async createRoom(client: Socket, dto: CreateRoomDto) {
    try {
      const chatRoom = await this.chatRoomsService.createRoom(
        client.handshake.auth._id,
        dto,
      );
      await client.join(chatRoom._id.toString());
      client.emit('create-room', {
        _id: chatRoom._id,
        name: chatRoom.name,
        participants: chatRoom.participants,
        createdAt: chatRoom.createdAt,
      });
    } catch (error) {
      throw new WsException({
        code: 100010,
        message: 'The requested chat room is not available to create.',
      });
    }
  }

  async joinRoom(client: Socket, dto: JoinRoomDto) {
    const chatRoom = await this.chatRoomsService.findRoomCanJoin(
      dto._id,
      client.handshake.auth._id,
    );
    if (!chatRoom)
      throw new WsException({
        code: 100010,
        message: 'The requested chat room is not available to join.',
      });
    await client.join(dto._id);
    client.emit('join-room', {
      _id: chatRoom._id,
      name: chatRoom.name,
      participants: chatRoom.participants,
      createdAt: chatRoom.createdAt,
    });
  }

  async exitRoom(client: Socket, dto: ExitRoomDto) {
    const result = await this.chatRoomsService.exitRoom(
      dto._id,
      client.handshake.auth._id,
    );
    if (result) {
      client.rooms.delete(dto._id);
      client.emit('exit-room', {
        _id: dto._id,
      });
    } else
      throw new WsException({
        code: 100010,
        message: 'The requested chat room is not available to exit.',
      });
  }
}
