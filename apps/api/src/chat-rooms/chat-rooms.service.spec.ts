import { CommonModule } from '@common/common.module';
import { ChatRoom, ChatRoomSchema } from '@common/schemas/chat-room.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { ChatRoomsService } from './chat-rooms.service';
import { paginationMock } from '@common/mock';
import { ChatRoomSurface } from './chat-rooms.http-response';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { Chat } from '@common/schemas/chat.schema';

describe('ChatRoomsService', () => {
  let chatRoomsService: ChatRoomsService;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonModule,
        MongooseModule.forFeature([
          {
            name: ChatRoom.name,
            schema: ChatRoomSchema,
          },
        ]),
      ],
      providers: [ChatRoomsService],
    }).compile();
    chatRoomsService = moduleRef.get<ChatRoomsService>(ChatRoomsService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  describe('find', () => {
    it('it should return a chat room data with pagination', async () => {
      const chatRooms = await chatRoomsService.find({ limit: 1, page: 1 });
      Object.keys(paginationMock).forEach((key) => {
        expect(chatRooms).toHaveProperty(key);
      });
      if (chatRooms.docs[0]) {
        const room = plainToInstance(ChatRoomSurface, chatRooms.docs[0]);
        expect(room).toBeInstanceOf(ChatRoomSurface);
      }
    });
  });

  describe('findChats', () => {
    it('it should return an array of chat logs after user has requested last chat checked time.', async () => {
      const chats = await chatRoomsService.findChats({
        roomId: configService.get<string>('TEST_ROOM_ID'),
        lastCheckTime: moment().add(-1, 'days').toDate(),
      });

      expect(Array.isArray(chats)).toBeTruthy();
      if (chats.length) {
        const chat = plainToInstance(Chat, chats[0]);
        expect(chat).toBeInstanceOf(Chat);
      }
    });
  });
});
