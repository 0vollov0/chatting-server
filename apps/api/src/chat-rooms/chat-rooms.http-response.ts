import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ChatRoom } from '@common/schemas/chat-room.schema';
import { Pagination } from '@common/type';
import { Type } from 'class-transformer';

export class ChatRoomSurface extends OmitType(ChatRoom, ['chats'] as const) {}

export class GetChatRoomsResponse extends Pagination {
  @ApiProperty({ type: ChatRoomSurface, isArray: true })
  @Type(() => ChatRoomSurface)
  docs: ChatRoomSurface[];
}
