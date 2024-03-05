import { PickType } from '@nestjs/swagger';
import { ChatRoom } from 'apps/common/src/schemas/chat-room.schema';

export class CreateRoomDto extends PickType(ChatRoom, ['name'] as const) {}
