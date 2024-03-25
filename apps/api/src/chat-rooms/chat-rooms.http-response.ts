import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ChatRoom } from 'apps/common/src/schemas/chat-room.schema';
import { Pagination } from 'apps/common/src/type';

class ChatRoomSurface extends OmitType(ChatRoom, ['chats'] as const) {}

export class GetChatRoomsResponse extends Pagination {
  @ApiProperty({ type: ChatRoomSurface, isArray: true })
  docs: ChatRoomSurface[];
}
