import {
  Chat,
  ChatType,
  UploadedChatFile,
} from 'apps/common/src/schemas/chat.schema';
import { SendChatDto } from '../dto/send-chat.dto';
import { SendChatWithFileDto } from '../dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from '../dto/send-chat-with-image.dto';

export interface AbstractChatFactory {
  process(): Omit<Chat, '_id'> | Promise<Omit<Chat, '_id'>>;
  upload(): UploadedChatFile;
}

export class ChatFactory implements AbstractChatFactory {
  constructor(dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto) {
    switch (dto.type) {
      case ChatType.message:
        return new ChatOnlyMessageFactory(dto as SendChatDto);
      case ChatType.file:
        return new ChatWithFileFactory(dto as SendChatWithFileDto);
      case ChatType.image:
        return new ChatWithImageFactory(dto as SendChatWithImageDto);
      default:
        throw new Error('Unknown chat type.');
    }
  }
  process(): Omit<Chat, '_id'> | Promise<Omit<Chat, '_id'>> {
    throw new Error('Method not implemented.');
  }
  upload(): UploadedChatFile {
    throw new Error('Method not implemented.');
  }
}

class ChatOnlyMessageFactory implements AbstractChatFactory {
  private dto: SendChatDto;
  constructor(dto: SendChatDto) {
    this.dto = dto;
  }
  process(): Omit<Chat, '_id'> | Promise<Omit<Chat, '_id'>> {
    throw new Error('Method not implemented.');
  }
  upload(): UploadedChatFile {
    throw new Error('Method not implemented.');
  }
}

class ChatWithFileFactory implements AbstractChatFactory {
  private dto: SendChatWithFileDto;
  constructor(dto: SendChatWithFileDto) {
    this.dto = dto;
  }
  process(): Omit<Chat, '_id'> | Promise<Omit<Chat, '_id'>> {
    throw new Error('Method not implemented.');
  }
  upload(): UploadedChatFile {
    throw new Error('Method not implemented.');
  }
}

class ChatWithImageFactory implements AbstractChatFactory {
  private dto: SendChatWithImageDto;
  constructor(dto: SendChatWithImageDto) {
    this.dto = dto;
  }
  process(): Omit<Chat, '_id'> | Promise<Omit<Chat, '_id'>> {
    throw new Error('Method not implemented.');
  }
  upload(): UploadedChatFile {
    throw new Error('Method not implemented.');
  }
}
