import {
  Chat,
  ChatType,
  UploadedChatFile,
} from 'apps/common/src/schemas/chat.schema';
import { SendChatDto } from '../dto/send-chat.dto';
import { SendChatWithFileDto } from '../dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from '../dto/send-chat-with-image.dto';
import * as moment from 'moment';
import { Axios } from '../axios/axios';
import mongoose from 'mongoose';
import { BufferType } from 'apps/common/src/type';
import { WsException } from '@nestjs/websockets';

export interface AbstractChatFactory {
  process(): Chat | Promise<Chat>;
  upload(): Promise<UploadedChatFile>;
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
        new WsException({
          status: 500,
          message: 'create chat factory object error',
        });
    }
  }
  process(): Chat | Promise<Chat> {
    throw new WsException({
      status: 500,
      message: 'process chat error',
    });
  }
  upload(): Promise<UploadedChatFile> {
    throw new WsException({
      status: 500,
      message: 'upload chat file error',
    });
  }
}

class ChatOnlyMessageFactory implements AbstractChatFactory {
  private dto: SendChatDto;
  constructor(dto: SendChatDto) {
    this.dto = dto;
  }
  process(): Chat | Promise<Chat> {
    const chat: Chat = {
      _id: new mongoose.Types.ObjectId().toString(),
      type: this.dto.type,
      // name: this.dto.name,
      message: this.dto.message,
      createdAt: moment().toDate(),
    };
    return chat;
  }
  upload(): Promise<UploadedChatFile> {
    throw new WsException({
      status: 500,
      message: 'upload chat file error',
    });
  }
}

class ChatWithBufferFactory implements AbstractChatFactory {
  protected dto: SendChatWithImageDto | SendChatWithFileDto;
  protected axios: Axios;
  protected bufferType: BufferType;
  constructor(
    dto: SendChatWithImageDto | SendChatWithFileDto,
    bufferType: BufferType,
  ) {
    this.dto = dto;
    this.bufferType = bufferType;
    this.axios = Axios.getInstance();
  }
  process(): Chat | Promise<Chat> {
    return new Promise<Chat>((resolve, reject) => {
      this.upload()
        .then((uploadedChatFile) => {
          resolve({
            ...uploadedChatFile,
            _id: new mongoose.Types.ObjectId().toString(),
            type: this.dto.type,
            message: this.dto.message,
            createdAt: moment().toDate(),
          });
        })
        .catch(reject);
    });
  }
  upload(): Promise<UploadedChatFile> {
    return this.axios.uploadFile({
      bufferType: this.bufferType,
      roomId: this.dto.roomId,
      buffer: this.dto.buffer,
      originalname: this.dto.originalname,
    });
  }
}

class ChatWithImageFactory extends ChatWithBufferFactory {
  constructor(dto: SendChatWithImageDto) {
    super(dto, 'image');
  }
}

class ChatWithFileFactory extends ChatWithBufferFactory {
  constructor(dto: SendChatWithFileDto) {
    super(dto, 'file');
  }
}
