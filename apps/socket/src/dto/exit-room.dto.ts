import { PickType } from '@nestjs/swagger';
import { ChatRoom } from 'apps/common/src/schemas/chat-room.schema';

export class ExitRoomDto extends PickType(ChatRoom, ['_id'] as const) {}
