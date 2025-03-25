import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import * as fs from 'fs';
import { join } from 'path';
import { UploadedChatFile } from '@common/schemas/chat.schema';
import * as moment from 'moment';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async createFile(dto: CreateFileDto): Promise<UploadedChatFile> {
    try {
      const roomPath = join(__dirname, '../../..', 'bucket', dto.bufferType, dto.roomId);

      if (!fs.existsSync(roomPath)) {
        fs.mkdirSync(roomPath, { recursive: true });
        this.logger.log(`${roomPath} directory created.`);
      }

      const filePath = join(roomPath, dto.filename);

      await fs.promises.writeFile(filePath, dto.buffer);

      const expireWeeks = dto.bufferType === 'file'
        ? +this.configService.get<string>('FILE_EXPIRE_WEEK', '4')
        : +this.configService.get<string>('IMAGE_EXPIRE_WEEK', '2');

      if (isNaN(expireWeeks)) {
        throw new Error('Invalid expire week configuration.');
      }

      const expireAt = moment().add(expireWeeks, 'weeks').startOf('hour');

      try {
        await this.redisService.client.rPush(
          `expire-${expireAt.toISOString()}`,
          join(dto.bufferType, dto.filename),
        );
      } catch (redisError) {
        this.logger.error(`Redis operation failed: ${redisError.message}`);
        throw new BadRequestException('Failed to store file expiration data in Redis.');
      }

      this.logger.log(`File successfully stored: ${dto.filename}`);

      return {
        filename: dto.filename,
        originalname: dto.originalname,
        size: dto.buffer.length,
        expireAt: expireAt.toDate(),
      };
      
    } catch (error) {
      this.logger.error(`File storage failed: ${error.message}`);
      throw new BadRequestException(error.message || 'File write failed');
    }
  }
}