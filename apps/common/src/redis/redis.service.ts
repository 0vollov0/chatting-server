import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { Chat } from '../schemas/chat.schema';

@Injectable()
export class RedisService {
  private _client: ReturnType<typeof createClient>;
  constructor(private readonly configService: ConfigService) {
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<string>('REDIS_PORT');

    createClient({ url: `redis://:${password}@${host}:${port}` })
      .on('error', (err) => {
        console.error(err);
      })
      .connect()
      .then((client) => (this._client = client));
  }

  public get client(): ReturnType<typeof createClient> {
    return this._client;
  }

  appendChat(roomId: string, chat: Chat) {
    return this._client.rPush(roomId, JSON.stringify(chat));
  }

  async getChatRoomIds() {
    return (await this._client.keys('room-*')).map(
      (keys) => keys.split('room-')[1] || '',
    );
  }

  lockChatRoom(id: string) {
    return this._client.set(`lock-${id}`, 1);
  }
  releaseChatRoom(id: string) {
    return this._client.del(`lock-${id}`);
  }

  async mergeChatRoom(id: string) {
    const chats = await this._client.lRange(`temp-${id}`, 0, -1);
    await this._client.del(`temp-${id}`);
    return chats.length ? this._client.lPush(`room-${id}`, chats) : 0;
  }

  removeChatRoom(id: string) {
    return this._client.del(`room-${id}`);
  }

  getChats(roomId: string) {
    return new Promise<Chat[]>((resolve, reject) => {
      try {
        this._client.lRange(`room-${roomId}`, 0, -1).then((values) => {
          const chats: Chat[] = JSON.parse(`[${values.toString()}]`);
          resolve(chats);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
