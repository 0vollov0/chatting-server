import { PickType } from '@nestjs/swagger';
import { ChatRoom } from '@common/schemas/chat-room.schema';

export class ExitRoomDto extends PickType(ChatRoom, ['_id'] as const) {}
