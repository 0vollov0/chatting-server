import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WsException } from '@nestjs/websockets';

import { SendChatWithFileDto } from './dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from './dto/send-chat-with-image.dto';
import { SendChatDto } from './dto/send-chat.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { ExitRoomDto } from './dto/exit-room.dto';

import { RedisService } from '@common/redis/redis.service';
import { ChatRoomsService } from '@common/chat-rooms/chat-rooms.service';
import { GrpcService } from './grpc/grpc.service';

import { ChatFactory } from './factories/chat-factory';
import { ChatType } from '@common/schemas/chat.schema';
import { ChatRoom } from '@common/schemas/chat-room.schema';

@Injectable()
export class SocketService {
  private server?: Server;

  constructor(
    private readonly redisService: RedisService,
    private readonly chatRoomsService: ChatRoomsService,
    private readonly grpcService: GrpcService,
    @InjectModel(ChatRoom.name) private readonly chatRoomModel: Model<ChatRoom>,
  ) {}

  public setServer(server: Server) {
    this.server = server;
  }

  private getClientId(client: Socket): string {
    const userId = client.handshake.auth?._id;
    if (!userId) throw new WsException({ status: 401, message: 'Unauthorized' });
    return userId;
  }

  private emitToClient(client: Socket, event: string, data: object) {
    client.emit(event, data);
  }

  async handleChat(dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto) {
    try {
      const chatFactory = ChatFactory.of(dto);

      if (dto.type !== ChatType.message) {
        chatFactory.bindUpload(this.grpcService);
      }

      const chat = await chatFactory.process();
      await this.redisService.appendChat(`${dto.roomId}`, chat);

      if (this.server) {
        this.server.to(dto.roomId).emit('chat', chat);
      }
    } catch (error) {
      throw new WsException({ status: 500, message: 'Failed to send chat' });
    }
  }

  async createRoom(client: Socket, dto: CreateRoomDto) {
    try {
      const userId = this.getClientId(client);
      const chatRoom = await this.chatRoomsService.createRoom(userId, dto);

      await client.join(chatRoom._id.toString());
      this.emitToClient(client, 'create-room', {
        _id: chatRoom._id,
        name: chatRoom.name,
        participants: chatRoom.participants,
        createdAt: chatRoom.createdAt,
      });
    } catch (error) {
      throw new WsException({ status: 500, message: 'Failed to create chat room' });
    }
  }

  async joinRoom(client: Socket, dto: JoinRoomDto) {
    if (client.rooms.has(dto._id)) {
      throw new WsException({ status: 400, message: 'You have already joined this room' });
    }

    try {
      const userId = this.getClientId(client);
      const chatRoom = await this.chatRoomsService.findRoomCanJoin(dto._id, userId);

      if (!chatRoom) {
        throw new WsException({ status: 404, message: 'Chat room not found or access denied' });
      }

      await client.join(dto._id);
      this.emitToClient(client, 'join-room', {
        _id: chatRoom._id,
        name: chatRoom.name,
        participants: chatRoom.participants,
        createdAt: chatRoom.createdAt,
      });
    } catch (error) {
      throw new WsException({ status: 500, message: 'Failed to join chat room' });
    }
  }

  async exitRoom(client: Socket, dto: ExitRoomDto) {
    try {
      const userId = this.getClientId(client);
      const success = await this.chatRoomsService.exitRoom(dto._id, userId);

      if (!success) {
        throw new WsException({ status: 500, message: 'Failed to exit chat room' });
      }

      client.rooms.delete(dto._id);
      this.emitToClient(client, 'exit-room', { _id: dto._id });
    } catch (error) {
      throw new WsException({ status: 500, message: 'Failed to exit chat room' });
    }
  }
}