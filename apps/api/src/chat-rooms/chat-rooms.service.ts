import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DatabasesService } from '@common/databases/databases.service';
import { ChatRoom } from '@common/schemas/chat-room.schema';
import mongoose, { Model } from 'mongoose';
import { FindChatRoomDto } from './dto/find-chat-room.dto';
import { PaginationMock, paginationMock } from '@common/mock';
import { FindChatsDto } from './dto/find-chats.dto';
import { RedisService } from '@common/redis/redis.service';
import { Chat } from '@common/schemas/chat.schema';
import * as moment from 'moment';

@Injectable()
export class ChatRoomsService {
  private readonly logger = new Logger(ChatRoomsService.name);

  constructor(
    private readonly databasesService: DatabasesService,
    private readonly redisService: RedisService,
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>,
  ) {}

  async find({
    limit,
    page,
  }: FindChatRoomDto): Promise<PaginationMock<ChatRoom>> {
    try {
      const values = await this.chatRoomModel.aggregate([
        { $project: { chats: 0 } },
        ...this.databasesService.pagination({ limit, page }),
      ]);

      return values[0] ?? paginationMock;
    } catch (error) {
      this.logger.error(`Failed to fetch chat rooms: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch chat rooms');
    }
  }

  async findChats({ roomId, lastCheckTime }: FindChatsDto): Promise<Chat[]> {
    try {
      const dbChats = await this.chatRoomModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
        { $unwind: '$chats' },
        { $replaceRoot: { newRoot: '$chats' } },
        { $match: { createdAt: { $gt: lastCheckTime } } },
      ]);

      const cacheChats = await this.redisService.getChats(roomId);
      const filteredCacheChats = cacheChats.filter(
        (chat) => chat.createdAt > lastCheckTime,
      );
      return [...dbChats, ...filteredCacheChats];
    } catch (error) {
      this.logger.error(
        `Failed to fetch chats for room ${roomId}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to fetch chats for room.');
    }
  }
}
