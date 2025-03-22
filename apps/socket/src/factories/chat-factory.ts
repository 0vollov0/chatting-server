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
  protected upload?: (
    bufferType: BufferType,
    dto: SendChatWithImageDto | SendChatWithFileDto,
  ) => Promise<UploadedChatFile>;

  constructor(dto: SendChatDto | SendChatWithFileDto | SendChatWithImageDto) {
    this.dto = dto;
  }

  protected generateChatId(): string {
    return new mongoose.Types.ObjectId().toString();
  }
}

interface IChatFactory {
  process: () => Promise<Chat>;
  adaptUpload?: (
    upload: (
      bufferType: BufferType,
      dto: SendChatWithImageDto | SendChatWithFileDto,
    ) => Promise<UploadedChatFile>,
  ) => void;
  bindUpload?: (grpcService: GrpcService) => void;
}

class ChatOnlyMessage extends AbstractChat implements IChatFactory {
  async process(): Promise<Chat> {
    return {
      _id: this.generateChatId(),
      type: this.dto.type,
      message: this.dto.message,
      createdAt: moment().toDate(),
    };
  }
}

class ChatWithBuffer extends AbstractChat implements IChatFactory {
  private bufferType: BufferType;

  constructor(dto: SendChatWithFileDto | SendChatWithImageDto) {
    super(dto);
    this.bufferType = dto.type === ChatType.image ? 'image' : 'file';
  }

  async process(): Promise<Chat> {
    if (!this.upload) {
      throw new InternalServerErrorException('Upload function is not defined.');
    }

    try {
      const uploadedChatFile = await this.upload(
        this.bufferType,
        this.dto as SendChatWithFileDto | SendChatWithImageDto,
      );

      return {
        ...uploadedChatFile,
        _id: this.generateChatId(),
        type: this.dto.type,
        message: this.dto.message,
        createdAt: moment().toDate(),
      };
    } catch (error) {
      throw new InternalServerErrorException('File upload failed.', error);
    }
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
    return dto.type === ChatType.message
      ? new ChatOnlyMessage(dto)
      : new ChatWithBuffer(dto as SendChatWithFileDto | SendChatWithImageDto);
  }
}