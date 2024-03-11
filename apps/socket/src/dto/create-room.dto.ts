import { PickType } from '@nestjs/swagger';
import { ChatRoom } from 'apps/common/src/schemas/chat-room.schema';
import { ArrayMaxSize, IsMongoId } from 'class-validator';

export class CreateRoomDto extends PickType(ChatRoom, ['name'] as const) {
  @ArrayMaxSize(10)
  @IsMongoId({ each: true })
  participantIds: string[];
}
