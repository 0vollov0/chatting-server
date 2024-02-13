import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { SendChatWithFileDto } from './dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from './dto/send-chat-with-image.dto';
import { SendChatDto } from './dto/send-chat.dto';
import { ChatFactory } from './factories/chat-factory';

@Injectable()
export class ChattingService {
  private _server: Server;
  constructor() {}

  public set server(server: Server) {
    this._server = server;
  }

  public get server(): Server {
    return this._server;
  }

  handleChat(dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto) {
    const chatFactory = new ChatFactory(dto);
    const chat = chatFactory.process();
    // save chat on the db //
  }
}
