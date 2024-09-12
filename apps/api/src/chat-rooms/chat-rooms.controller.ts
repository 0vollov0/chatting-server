import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FindChatRoomDto } from './dto/find-chat-room.dto';
import { ChatRoomsService } from './chat-rooms.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetChatRoomsResponse } from './chat-rooms.http-response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FindChatsDto } from './dto/find-chats.dto';
import { Chat } from '@common/schemas/chat.schema';

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

  @Get('chats')
  @ApiOperation({
    summary: 'It is able to get chat logs in specific chat room.',
  })
  @ApiResponse({
    status: 200,
    type: Chat,
    isArray: true,
  })
  findChats(@Query() dto: FindChatsDto) {
    return this.chatRoomsService.findChats(dto);
  }
}
