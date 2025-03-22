import { PipeTransform, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { validateOrReject } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { SendChatDto } from '../dto/send-chat.dto';
import { ChatType } from '@common/schemas/chat.schema';
import { SendChatWithFileDto } from '../dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from '../dto/send-chat-with-image.dto';

@Injectable()
export class SendChatValidation implements PipeTransform {
  transform(
    input: SendChatDto | SendChatWithFileDto | SendChatWithImageDto,
  ) {
    return new Promise((resolve, reject) => {
      const dtoClass = this.getDtoClass(input.type);
      if (!dtoClass) reject(new WsException({ code: 10001, message: '지원되지 않는 채팅 유형입니다.' }));

      const instance = plainToInstance(dtoClass, input);
      try {
        validateOrReject(instance)
          .then(() => resolve(instance))
          .catch(() => reject(new WsException({ code: 10002, message: '유효하지 않은 요청입니다.' })));
      } catch (error) {
        reject(new WsException({ code: 10002, message: '유효하지 않은 요청입니다.' }));
      }
    })
  }

  private getDtoClass<T extends SendChatDto | SendChatWithFileDto | SendChatWithImageDto>(
    type: ChatType,
  ): ClassConstructor<T> | null {
    switch (type) {
      case ChatType.message:
        return SendChatDto as ClassConstructor<T>;
      case ChatType.file:
        return SendChatWithFileDto as ClassConstructor<T>;
      case ChatType.image:
        return SendChatWithImageDto as ClassConstructor<T>;
      default:
        return null;
    }
  }
}