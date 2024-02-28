import { BufferLength } from 'apps/common/src/pipes/buffer-length';
import { MB } from 'apps/common/src/util/mb';
import { Matches, MaxLength } from 'class-validator';
import { SendChatDto } from './send-chat.dto';
import {
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';

export class SendChatWithImageDto extends IntersectionType(
  OmitType(SendChatDto, ['message'] as const),
  PartialType(PickType(SendChatDto, ['message'] as const)),
) {
  @BufferLength(0, MB(5))
  buffer: Buffer;

  @MaxLength(256)
  @Matches(/\.(jpg|jpeg|png|webp)$/)
  originalname: string;
}
