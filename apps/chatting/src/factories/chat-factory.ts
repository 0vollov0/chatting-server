import {
  Chat,
  ChatType,
  UploadedChatFile,
} from 'apps/common/src/schemas/chat.schema';
import { SendChatDto } from '../dto/send-chat.dto';
import { SendChatWithFileDto } from '../dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from '../dto/send-chat-with-image.dto';
import { createClient } from 'redis';
import * as moment from 'moment';
import { Axios } from '../axios/axios';

export interface AbstractChatFactory {
  process(): Omit<Chat, '_id'> | Promise<Omit<Chat, '_id'>>;
  upload(): Promise<UploadedChatFile>;
}

export class ChatFactory implements AbstractChatFactory {
  constructor(
    dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto,
    redis?: ReturnType<typeof createClient>,
  ) {
    switch (dto.type) {
      case ChatType.message:
        return new ChatOnlyMessageFactory(dto as SendChatDto);
      case ChatType.file:
        return new ChatWithFileFactory(dto as SendChatWithFileDto, redis);
      case ChatType.image:
        return new ChatWithImageFactory(dto as SendChatWithImageDto, redis);
      default:
        throw new Error('Unknown chat type.');
    }
  }
  process(): Omit<Chat, '_id'> | Promise<Omit<Chat, '_id'>> {
    throw new Error('Method not implemented.');
  }
  upload(): Promise<UploadedChatFile> {
    throw new Error('Method not implemented.');
  }
}

class ChatOnlyMessageFactory implements AbstractChatFactory {
  private dto: SendChatDto;
  constructor(dto: SendChatDto) {
    this.dto = dto;
  }
  process(): Omit<Chat, '_id'> | Promise<Omit<Chat, '_id'>> {
    const chat: Omit<Chat, '_id'> = {
      type: this.dto.type,
      name: this.dto.name,
      createdAt: moment().toDate(),
    };
    return chat;
  }
  upload(): Promise<UploadedChatFile> {
    throw new Error('Method not implemented.');
  }
}

class ChatWithFileFactory implements AbstractChatFactory {
  private dto: SendChatWithFileDto;
  private redis: ReturnType<typeof createClient>;
  constructor(
    dto: SendChatWithFileDto,
    redis: ReturnType<typeof createClient>,
  ) {
    this.dto = dto;
    this.redis = redis;
  }
  process(): Omit<Chat, '_id'> | Promise<Omit<Chat, '_id'>> {
    this.upload().then((value) => {
      console.log(value);
    });
    return null;
  }
  upload(): Promise<UploadedChatFile> {
    const axios = Axios.getInstance();
    return axios.uploadFile({
      roomId: this.dto.roomId,
      buffer: this.dto.buffer,
      originalname: this.dto.originalname,
    });
  }
}

class ChatWithImageFactory implements AbstractChatFactory {
  private dto: SendChatWithImageDto;
  private redis: ReturnType<typeof createClient>;
  constructor(
    dto: SendChatWithImageDto,
    redis: ReturnType<typeof createClient>,
  ) {
    this.dto = dto;
    this.redis = redis;
  }
  process(): Omit<Chat, '_id'> | Promise<Omit<Chat, '_id'>> {
    throw new Error('Method not implemented.');
  }
  upload(): Promise<UploadedChatFile> {
    throw new Error('Method not implemented.');
  }
}
