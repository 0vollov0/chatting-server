import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { Chat } from '../schemas/chat.schema';

@Injectable()
export class RedisService {
  private _client!: ReturnType<typeof createClient>;  // "!"를 붙여 TS에서 undefined 경고 방지
  private _clientReady: any;

  constructor(private readonly configService: ConfigService) {
    this._client = createClient({
      socket: {
        port: +this.configService.get<string>('REDIS_PORT'),
        host: this.configService.get<string>('REDIS_HOST'),
      },
      password: this.configService.get<string>('ENV') === 'LOCAL'
        ? undefined
        : this.configService.get<string>('REDIS_PASSWORD'),
    });

    this._client.on('error', (err) => {
      Logger.error(err, this.constructor.name);
    });

    this._clientReady = this._client.connect();
  }

  private async getClient() {
    await this._clientReady;
    return this._client;
  }

  public get client(): ReturnType<typeof createClient> {
    return this._client;
  }

  async appendChat(roomId: string, chat: Chat) {
    await this._client.xAdd(`room-${roomId}`, '*', { chat: JSON.stringify(chat) });
  }

  async getChatRoomIds() {
    return await this._client.keys('room-*');
    // return (await this._client.keys('room-*')).map(
    //   (keys) => keys.split('room-')[1] || '',
    // );
  }

  removeChatRoom(id: string) {
    return this._client.del(`room-${id}`);
  }

  async getChats(roomId: string): Promise<Chat[]> {
    const client = await this.getClient();
    
    try {
      const res = await client.xRead({
        key: `room-${roomId}`,
        id: '0',
      });
  
      if (!res || res.length === 0) {
        return [];
      }
  
      return res[0].messages.map((message) => JSON.parse(message.message.chat));
    } catch (error) {
      Logger.error(`Failed to retrieve chats for room ${roomId}: ${error.message}`, 'RedisService');
      throw new Error(`Failed to fetch chats: ${error.message}`);
    }
  }

  async readStreamChats(roomId: string): Promise<{ ids: string[]; chats: Chat[] }> {
    const client = await this.getClient();
    try {
      await this.createStreamGroupIfNotExists(roomId);
      
      const res = await client.xReadGroup(
        'chat_group',
        'worker-1',
        { key: roomId, id: '>' },
        { COUNT: 10, BLOCK: 5000 }, // 한 번에 최대 10개 가져오고, 없으면 5초 동안 대기
      );

      if (!res) {
        console.log(`⚠️ No new messages for room ${roomId}`);
        return { ids: [], chats: [] };
      }

      const chats: Chat[] = [];
      const ids: string[] = [];
      
      for (const { id, message } of res[0]?.messages || []) {
        chats.push(JSON.parse(message['chat']));
        ids.push(id);
      }
  
      if (ids.length > 0) {
        await client.xAck(roomId, 'chat_group', ids);
      }
  
      return { ids, chats };
    } catch (error) {
      Logger.error(error, `Error reading stream chats for room ${roomId}`);
      throw error;
    }
  }

  ackStream(roomId: string, ids: string[]) {
    return this._client.xAck(roomId, 'chat_group', ids);
  }

  async createStreamGroup(roomId: string) {
    const client = await this.getClient();
  
    try {
      const groups = await client.xInfoGroups(roomId);
      const groupExists = groups.some(group => group.name === 'chat_group');
  
      if (!groupExists) {
        await client.xGroupCreate(roomId, 'chat_group', '0', { MKSTREAM: true });
      }
    } catch (error) {
      if (error.message.includes('BUSY GROUP')) {
        Logger.warn(`Stream group already exists for ${roomId}`);
      } else {
        Logger.error(error, `Failed to create stream group for ${roomId}`);
        throw error;
      }
    }
  }

  async createStreamGroupIfNotExists(roomId: string) {
    const client = await this.getClient();
    const streamKey = roomId;
  
    try {
      const groups = await client.xInfoGroups(streamKey);
      const groupExists = groups.some(group => group.name === 'chat_group');
  
      if (!groupExists) {
        await client.xGroupCreate(streamKey, 'chat_group', '0', { MKSTREAM: true });
        console.log(`✅ Consumer group 'chat_group' created for stream '${streamKey}'`);
      }
    } catch (error) {
      if (error.message.includes('NO GROUP')) {
        await client.xGroupCreate(streamKey, 'chat_group', '0', { MKSTREAM: true });
        console.log(`✅ Stream '${streamKey}' and consumer group 'chat_group' created`);
      } else {
        console.error(`🚨 Failed to check or create consumer group for ${streamKey}:`, error);
      }
    }
  }

  public quit() {
    this._client.quit();
  }
}
