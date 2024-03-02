import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { SendChatWithFileDto } from './dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from './dto/send-chat-with-image.dto';
import { SendChatDto } from './dto/send-chat.dto';
import { ChatFactory } from './factories/chat-factory';
import { RedisService } from 'apps/common/src/redis/redis.service';

@Injectable()
export class SocketService {
  private _server: Server;
  constructor(private readonly redisService: RedisService) {}

  public set server(server: Server) {
    this._server = server;
  }

  public get server(): Server {
    return this._server;
  }

  async handleChat(
    dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto,
  ) {
    const chatFactory = new ChatFactory(dto);
    const chat = await chatFactory.process();
    this.redisService.appendChat(`${dto.roomId}`, chat).then((value) => {
      console.log(chat);
      console.log(value);
    });
  }
}
