import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from 'apps/common/src/redis/redis.service';
import { ChatRoom } from 'apps/common/src/schemas/chat-room.schema';
import mongoose, { Model, startSession } from 'mongoose';
import * as moment from 'moment';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class WorkerService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async saveChat() {
    try {
      const roomIds = await this.redisService.getChatRoomIds();
      for (const roomId of roomIds) {
        const session = await mongoose.startSession();
        console.log('MongoDB session started');

        session.startTransaction();
        console.log('Transaction started');
        
        try {
          const { ids, chats } = await this.redisService.readStreamChats(roomId);
          await this.chatRoomModel.updateOne(
            { _id: new mongoose.Types.ObjectId(roomId) },
            { $push: { chats } },
            { session },
          );

          await this.redisService.ackStream(roomId, ids);
          await session.commitTransaction();
        } catch (error) {
          console.error(`Error saving chat for room ${roomId}:`, error);
          await session.abortTransaction();
          await this.redisService.createStreamGroup(roomId);
        } finally {
          session.endSession();
        }
      }
    } catch (error) {
      console.log('error');
      
      console.error(`Error in saveChat cron job:`, error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async removeExpiredFiles() {
    const now = moment();
    try {
      const keys = await this.redisService.client.keys('expire-*');
      for (const key of keys) {
        if (now.isAfter(moment(key.slice(7)))) {
          const paths = await this.redisService.client.lRange(key, 0, -1);
          for (const path of paths) {
            try {
              await fs.promises.rm(join(__dirname, '../../..', 'bucket', path));
            } catch (err) {
              console.error(`Failed to remove file: ${path}`, err);
            }
          }
          await this.redisService.client.del(key);
        }
      }
    } catch (error) {
      console.error(`Error in removeExpiredFiles cron job:`, error);
    }
  }

  // @Cron(CronExpression.EVERY_SECOND)
  // async saveChat() {
  //   try {
  //     const roomIds = await this.redisService.getChatRoomIds();
  //     for (const roomId of roomIds) {
  //       mongoose.startSession().then(async (session) => {
  //         try {
  //           const { ids, chats } =
  //             await this.redisService.readStreamChats(roomId);
  //           console.log(ids, chats);
            
  //           await this.chatRoomModel.updateOne(
  //             {
  //               _id: new mongoose.Types.ObjectId(roomId),
  //             },
  //             {
  //               $push: {
  //                 chats,
  //               },
  //             },
  //             { session },
  //           );
  //           await this.redisService.ackStream(roomId, ids);
  //           await session.commitTransaction();
  //           session.endSession();
  //         } catch (error) {
  //           await session.abortTransaction();
  //           session.endSession();
  //           await this.redisService.createStreamGroup(roomId);
  //         }
  //       });
        
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  // @Cron(CronExpression.EVERY_HOUR)
  // removeExpiredFiles() {
  //   const now = moment();
  //   this.redisService.client.keys('expire-*').then((keys) => {
  //     keys.forEach((key) => {
  //       if (now.isAfter(moment(key.slice(7)))) {
  //         this.redisService.client.lRange(key, 0, -1).then((paths) => {
  //           paths.forEach((path) => {
  //             fs.rmSync(join(__dirname, '../../..', 'bucket', path));
  //           });
  //         });
  //       }
  //     });
  //   });
  // }

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
