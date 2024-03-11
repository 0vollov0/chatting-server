import { PickType } from '@nestjs/swagger';
import { Chat } from 'apps/common/src/schemas/chat.schema';
import { IsMongoId, Length } from 'class-validator';

export class SendChatDto extends PickType(Chat, ['type'] as const) {
  @IsMongoId()
  roomId: string;

  @Length(1, 512)
  message: string;

  /* @Length(1, 64)
  name: string; */
}
