import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { Chat } from '../schemas/chat.schema';

@Injectable()
export class RedisService {
  private _client: ReturnType<typeof createClient>;
  constructor(private readonly configService: ConfigService) {
    const password =
      this.configService.get<string>('ENV') === 'LOCAL'
        ? undefined
        : this.configService.get<string>('REDIS_PASSWORD');
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<string>('REDIS_PORT');
    createClient({
      socket: {
        port: +port,
        host,
      },
      password: password,
    })
      .on('error', (err) => {
        console.error(err);
      })
      .connect()
      .then((client) => (this._client = client));
  }

  public get client(): ReturnType<typeof createClient> {
    return this._client;
  }

  async appendChat(roomId: string, chat: Chat) {
    const isLock = await this._client.get(`lock-${roomId}`);
    if (isLock)
      return this._client.lPush(`temp-${roomId}`, JSON.stringify(chat));
    else return this._client.rPush(`room-${roomId}`, JSON.stringify(chat));
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
        const cache1 = this._client.lRange(`room-${roomId}`, 0, -1);
        const cache2 = this._client.lRange(`temp-room-${roomId}`, 0, -1);
        const unlockedChats: Chat[] = JSON.parse(`[${cache1.toString()}]`);
        const lockedChats: Chat[] = JSON.parse(`[${cache2.toString()}]`);
        resolve(unlockedChats.concat(lockedChats));
      } catch (error) {
        reject(error);
      }
    });
  }
}
