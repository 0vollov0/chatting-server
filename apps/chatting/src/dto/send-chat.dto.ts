import { PickType } from '@nestjs/swagger';
import { BufferLength } from 'apps/common/src/pipes/buffer-length';
import { Chat } from 'apps/common/src/schemas/chat.schema';
import { MB } from 'apps/common/src/util/mb';
import { IsOptional } from 'class-validator';

export class SendChatDto extends PickType(Chat, [
  'message',
  'type',
  'originalname',
] as const) {
  @IsOptional()
  @BufferLength(0, MB(10))
  buffer?: number | undefined;
}
