import { PipeTransform, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SendChatDto } from '../dto/send-chat.dto';
import { ChatType } from 'apps/common/src/schemas/chat.schema';
import { SendChatWithFileDto } from '../dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from '../dto/send-chat-with-image.dto';

@Injectable()
export class SendChatValidation implements PipeTransform {
  async transform(
    input: SendChatDto | SendChatWithFileDto | SendChatWithImageDto,
  ) {
    let instance: object;

    switch (input.type) {
      case ChatType.message:
        instance = plainToInstance(SendChatDto, input);
        break;
      case ChatType.file:
        instance = plainToInstance(SendChatWithFileDto, input);
        break;
      case ChatType.image:
        instance = plainToInstance(SendChatWithImageDto, input);
        break;
      default:
        throw new WsException({ code: 10001, message: 'Unknown chat type' });
    }
    try {
      await validateOrReject(instance);
    } catch (errors) {
      throw new WsException(errors);
    }
    return input;
  }
}
