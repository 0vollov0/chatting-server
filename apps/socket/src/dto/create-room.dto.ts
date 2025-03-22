import { PickType } from '@nestjs/swagger';
import { ChatRoom } from '@common/schemas/chat-room.schema';
import { ArrayMaxSize, IsMongoId } from 'class-validator';

export class CreateRoomDto extends PickType(ChatRoom, ['name'] as const) {
  @ArrayMaxSize(10)
  @IsMongoId({ each: true })
  participantIds: string[];
}
