import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DatabasesService } from '@common/databases/databases.service';
import { ChatRoom } from '@common/schemas/chat-room.schema';
import mongoose, { Model } from 'mongoose';
import { FindChatRoomDto } from './dto/find-chat-room.dto';
import { PaginationMock, paginationMock } from '@common/mock';
import { FindChatsDto } from './dto/find-chats.dto';
import * as moment from 'moment';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class ChatRoomsService {
  constructor(
    private readonly databasesService: DatabasesService,
    private readonly redisService: RedisService,
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>,
  ) {}

  find({ limit, page }: FindChatRoomDto): Promise<PaginationMock<ChatRoom>> {
    return new Promise((resolve, reject) => {
      this.chatRoomModel
        .aggregate([
          {
            $project: {
              chats: 0,
            },
          },
          ...this.databasesService.pagination({ limit, page }),
        ])
        .then((values) => {
          resolve(values.length ? values[0] : paginationMock);
        })
        .catch(reject);
    });
  }

  findChats({ roomId, lastCheckTime }: FindChatsDto) {
    return new Promise((resolve, reject) => {
      this.chatRoomModel
        .aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(roomId),
            },
          },
          {
            $unwind: '$chats',
          },
          {
            $replaceRoot: {
              newRoot: '$chats',
            },
          },
          {
            $match: {
              createdAt: {
                $gt: lastCheckTime,
              },
            },
          },
        ])
        .then((dbChats) => {
          this.redisService
            .getChats(roomId)
            .then((cacheChats) => {
              resolve(
                dbChats.concat(
                  cacheChats.filter(
                    (chat) => moment(chat.createdAt).toDate() > lastCheckTime,
                  ),
                ),
              );
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
