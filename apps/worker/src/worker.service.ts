import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from 'apps/common/src/redis/redis.service';
import { ChatRoom } from 'apps/common/src/schemas/chat-room.schema';
import mongoose, { Model } from 'mongoose';
import * as moment from 'moment';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class WorkerService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'save_chat',
    timeZone: 'Asia/Seoul',
  })
  async saveChat() {
    try {
      const roomIds = await this.redisService.getChatRoomIds();
      for (const roomId of roomIds) {
        const lockResult = await this.redisService.lockChatRoom(roomId);
        if (lockResult !== 'OK') throw new Error(`${roomId} doesn't lock`);
        const chats = await this.redisService.getChats(roomId);
        await this.redisService.removeChatRoom(roomId);
        await this.chatRoomModel.updateOne(
          {
            _id: new mongoose.Types.ObjectId(roomId),
          },
          {
            $push: {
              chats,
            },
          },
        );
        await this.redisService.releaseChatRoom(roomId);
        await this.redisService.mergeChatRoom(roomId);
      }
    } catch (error) {
      console.error(error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  removeExpiredFiles() {
    const now = moment();
    this.redisService.client.keys('expire-*').then((keys) => {
      keys.forEach((key) => {
        if (now.isAfter(moment(key.slice(7)))) {
          this.redisService.client.lRange(key, 0, -1).then((paths) => {
            paths.forEach((path) => {
              fs.rmSync(join(__dirname, '../../..', 'bucket', path));
            });
          });
        }
      });
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  removeOldChats() {
    const oneMonthAgo = moment().add(-1, 'months').toDate();
    this.chatRoomModel.updateMany(
      {},
      {
        $pull: {
          chats: {
            $lt: oneMonthAgo,
          },
        },
      },
    );
  }
}
