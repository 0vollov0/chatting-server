import { PipeTransform, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SendChatDto } from '../dto/send-chat.dto';

@Injectable()
export class SendChatValidation implements PipeTransform {
  async transform(input: SendChatDto) {
    const instance = plainToInstance(SendChatDto, input);
    try {
      await validateOrReject(instance);
    } catch (errors) {
      throw new WsException(errors);
    }
    return input;
  }
}
