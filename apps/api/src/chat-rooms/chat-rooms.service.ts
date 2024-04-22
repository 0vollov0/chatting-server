import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DatabasesService } from 'apps/common/src/databases/databases.service';
import { ChatRoom } from 'apps/common/src/schemas/chat-room.schema';
import mongoose, { Model } from 'mongoose';
import { FindChatRoomDto } from './dto/find-chat-room.dto';
import { paginationMock } from 'apps/common/src/mock';
import { FindChatsDto } from './dto/find-chats.dto';

@Injectable()
export class ChatRoomsService {
  constructor(
    private readonly databasesService: DatabasesService,
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>,
  ) {}

  find({ limit, page }: FindChatRoomDto) {
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

  findChats({ roomId, lastChatId }: FindChatsDto) {
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
              _id: {
                $gt: new mongoose.Types.ObjectId(lastChatId),
              },
            },
          },
        ])
        .then(resolve)
        .catch(reject);
    });
  }
}
