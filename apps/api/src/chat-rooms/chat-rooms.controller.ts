import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FindChatRoomDto } from './dto/find-chat-room.dto';
import { ChatRoomsService } from './chat-rooms.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetChatRoomsResponse } from './chat-rooms.http-response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('chat-rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat-rooms')
export class ChatRoomsController {
  constructor(private readonly chatRoomsService: ChatRoomsService) {}

  @Get()
  @ApiResponse({
    status: 200,
    type: GetChatRoomsResponse,
  })
  find(@Query() dto: FindChatRoomDto) {
    return this.chatRoomsService.find(dto);
  }
}
