import { PickType } from '@nestjs/swagger';
import { ChatRoom } from '@common/schemas/chat-room.schema';

export class JoinRoomDto extends PickType(ChatRoom, ['_id'] as const) {}
