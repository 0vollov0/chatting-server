import { BufferLength } from '@common/pipes/buffer-length';
import { MB } from '@common/util/mb';
import { Matches, MaxLength } from 'class-validator';
import { SendChatDto } from './send-chat.dto';
import {
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';

export class SendChatWithFileDto extends IntersectionType(
  OmitType(SendChatDto, ['message'] as const),
  PartialType(PickType(SendChatDto, ['message'] as const)),
) {
  @BufferLength(0, MB(30))
  buffer: Buffer;

  @MaxLength(256)
  @Matches(/\.[A-Za-z0-9]+$/)
  originalname: string;
}
