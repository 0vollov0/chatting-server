import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import * as fs from 'fs';
import { join } from 'path';
import { UploadedChatFile } from 'apps/common/src/schemas/chat.schema';
import * as moment from 'moment';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'apps/common/src/redis/redis.service';

@Injectable()
export class FileService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}
  createFile(dto: CreateFileDto) {
    const roomPath = join(
      __dirname,
      '../../..',
      'bucket',
      dto.bufferType,
      dto.roomId,
    );
    if (!fs.existsSync(roomPath)) {
      fs.mkdirSync(roomPath);
      console.log(`${roomPath} has been created.`);
    }

    return new Promise<UploadedChatFile>((resolve, reject) => {
      fs.writeFile(join(roomPath, dto.filename), dto.buffer, async (err) => {
        if (!err) {
          const expireAt = moment()
            .add(
              dto.bufferType === 'file'
                ? +this.configService.get<string>('FILE_EXPIRE_WEEK')
                : +this.configService.get<string>('IMAGE_EXPIRE_WEEK'),
              'weeks',
            )
            .startOf('hour');
          await this.redisService.client.rPush(
            `expire-${expireAt.toISOString()}`,
            join(dto.bufferType, dto.filename),
          );
          const uploadedChatFile: UploadedChatFile = {
            filename: dto.filename,
            originalname: dto.originalname,
            size: dto.buffer.length,
            expireAt: expireAt.toDate(),
          };
          resolve(uploadedChatFile);
        } else reject(new BadRequestException(err));
      });
    });
  }
}
