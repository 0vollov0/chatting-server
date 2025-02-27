import { Injectable, Logger } from '@nestjs/common';
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
        Logger.error(err, this.constructor.name);
      })
      .connect()
      .then((client) => {
        this._client = client;
        this._client.xInfoGroups('room-1').then((res) => {
          const group = res.find((group) => group.name === 'chat_group');
          if (!group) {
            this._client
              .xGroupCreate('room-1', 'chat_group', '0')
              .then((res) => {
                Logger.log(res, 'redis service');
              });
          }
        });
      });
  }

  public get client(): ReturnType<typeof createClient> {
    return this._client;
  }

  async appendChat(roomId: string, chat: Chat) {
    await this._client.xAdd(roomId, '*', { chat: JSON.stringify(chat) });
  }

  async getChatRoomIds() {
    return (await this._client.keys('room-*')).map(
      (keys) => keys.split('room-')[1] || '',
    );
  }

  removeChatRoom(id: string) {
    return this._client.del(`room-${id}`);
  }

  getChats(roomId: string) {
    return new Promise<Chat[]>(async (resolve, reject) => {
      try {
        const res = await this._client.xRead({
          key: `room-${roomId}`,
          id: '0',
        });

        const cachedChats = res[0].messages.map((message) =>
          JSON.parse(message['message']['chat']),
        );
        resolve(cachedChats);
      } catch (error) {
        reject(error);
      }
    });
  }

  readStreamChats(roomId: string): Promise<{ ids: string[]; chats: Chat[] }> {
    return new Promise((resolve, reject) => {
      this._client
        .xReadGroup(
          'chat_group',
          'worker-1',
          { key: roomId, id: '>' },
          {
            COUNT: 1,
          },
        )
        .then((res) => {
          const chats: Chat[] = [];
          const ids: string[] = [];
          res[0].messages.forEach(({ id, message }) => {
            chats.push(JSON.parse(message['chat']));
            ids.push(id);
          });
          resolve({ ids, chats });
        })
        .catch(reject);
    });
  }

  ackStream(roomId: string, ids: string[]) {
    return this._client.xAck(roomId, 'chat_group', ids);
  }

  async createStreamGroup(roomId: string) {
    await this._client.xGroupDestroy(roomId, 'chat_group');
    await this._client.xGroupCreate(roomId, 'chat_group', '0');
  }
}
