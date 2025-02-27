import { Chat, ChatType, UploadedChatFile } from '@common/schemas/chat.schema';
import { SendChatWithFileDto } from '../dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from '../dto/send-chat-with-image.dto';
import { SendChatDto } from '../dto/send-chat.dto';
import { BufferType } from '@common/type';
import mongoose from 'mongoose';
import * as moment from 'moment';
import { InternalServerErrorException } from '@nestjs/common';
import { GrpcService } from '../grpc/grpc.service';

abstract class AbstractChat {
  protected dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto;
  protected upload: (
    bufferType: BufferType,
    dto: SendChatWithImageDto | SendChatWithFileDto,
  ) => Promise<UploadedChatFile>;
  constructor(dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto) {
    this.dto = dto;
  }
}

interface IChatFactory {
  process: () => Chat | Promise<Chat>;
  adaptUpload?: (
    upload: (
      bufferType: BufferType,
      dto: SendChatWithImageDto | SendChatWithFileDto,
    ) => Promise<UploadedChatFile>,
  ) => void;
  bindUpload?: (grpcService: GrpcService) => void;
}

class ChatOnlyMessage extends AbstractChat implements IChatFactory {
  process() {
    const chat: Chat = {
      _id: new mongoose.Types.ObjectId().toString(),
      type: this.dto.type,
      message: this.dto.message,
      createdAt: moment().toDate(),
    };
    return chat;
  }
}

class ChatWithBuffer extends AbstractChat implements IChatFactory {
  private bufferType: BufferType;
  constructor(dto: SendChatWithFileDto | SendChatWithFileDto) {
    super(dto);
    this.bufferType = dto.type === ChatType.image ? 'image' : 'file';
  }
  process() {
    return new Promise<Chat>((resolve, reject) => {
      if (!this.upload) reject(new InternalServerErrorException());
      else {
        this.upload(
          this.bufferType,
          this.dto as SendChatWithFileDto | SendChatWithFileDto,
        )
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
      }
    });
  }
  adaptUpload(
    upload: (
      bufferType: BufferType,
      dto: SendChatWithImageDto | SendChatWithFileDto,
    ) => Promise<UploadedChatFile>,
  ) {
    this.upload = upload;
  }
  bindUpload(grpcService: GrpcService) {
    this.upload = grpcService.upload.bind(grpcService);
  }
}

export class ChatFactory {
  static of(
    dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto,
  ): IChatFactory {
    const { type } = dto;
    if (type == ChatType.message) return new ChatOnlyMessage(dto);
    else
      return new ChatWithBuffer(
        dto as SendChatWithFileDto | SendChatWithImageDto,
      );
  }
}
