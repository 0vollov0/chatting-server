import { Test, TestingModule } from '@nestjs/testing';
import { ChatRoomsService } from './chat-rooms.service';
import { getModelToken } from '@nestjs/mongoose';
import { ChatRoom } from '@common/schemas/chat-room.schema';
import { DatabasesService } from '@common/databases/databases.service';
import { RedisService } from '@common/redis/redis.service';
import { FindChatRoomDto } from './dto/find-chat-room.dto';
import { FindChatsDto } from './dto/find-chats.dto';
import { InternalServerErrorException } from '@nestjs/common';
import mongoose from 'mongoose';
import { paginationMock } from '@common/mock';
import { Chat, ChatType } from '@common/schemas/chat.schema';
import * as moment from 'moment';

describe('ChatRoomsService', () => {
  let service: ChatRoomsService;
  let chatRoomModel: any;
  let redisService: RedisService;

  const mockChatRoomModel = {
    aggregate: jest.fn(),
  };

  const mockRedisService = {
    getChats: jest.fn(),
  };

  const databasesService = {
    pagination: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatRoomsService,
        { provide: DatabasesService, useValue: databasesService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: getModelToken(ChatRoom.name), useValue: mockChatRoomModel },
      ],
    }).compile();
  
    service = module.get<ChatRoomsService>(ChatRoomsService);
    chatRoomModel = module.get(getModelToken(ChatRoom.name));
    redisService = module.get<RedisService>(RedisService);
  });

  describe('find()', () => {
    it('✅ Should return a list of chat rooms', async () => {
      const mockChatRooms = paginationMock;
      chatRoomModel.aggregate.mockResolvedValueOnce(mockChatRooms);
      databasesService.pagination.mockReturnValue('');
      const dto: FindChatRoomDto = { limit: 10, page: 1 };
      const result = await service.find(dto);

      expect(result).toEqual(mockChatRooms);
      expect(chatRoomModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('❌ Should throw an exception when a service error occurs', async () => {
      chatRoomModel.aggregate.mockRejectedValueOnce(new Error('Database Error'));

      const dto: FindChatRoomDto = { limit: 10, page: 1 };

      await expect(service.find(dto)).rejects.toThrow(new InternalServerErrorException('Failed to fetch chat rooms'));
    });
  });

  describe('findChats()', () => {
    it('✅ Should merge chats from both the database and Redis', async () => {
      const roomId = new mongoose.Types.ObjectId().toHexString();
      const lastCheckTime = moment().subtract(2, 'minutes').toDate();

      const dbChats: Chat[] = [
        {
          "_id": "6603f9bcb2d5a5f8c8a6f2e3",
          "type": ChatType.image,
          "message": "Hello, this is a test message!",
          "createdAt": new Date(),
          "originalname": "image.png",
          "filename": "6603f9bcb2d5a5f8c8a6f2e3.png",
          "size": 204800,
          "expireAt": new Date()
        }
      ];
      const redisChats: Chat[] = [
        {
          "_id": "6603f9bcb2d5a5f8c8a6f2e4",
          "type": ChatType.image,
          "message": "Hello, this is a test message!",
          "createdAt": new Date(),
          "originalname": "image.png",
          "filename": "6603f9bcb2d5a5f8c8a6f2e3.png",
          "size": 204800,
          "expireAt": new Date()
        }
      ];

      chatRoomModel.aggregate.mockResolvedValueOnce(dbChats);
      jest.spyOn(redisService, 'getChats').mockResolvedValueOnce(redisChats);
      
      const dto: FindChatsDto = { roomId, lastCheckTime };
      const result = await service.findChats(dto);
      expect(result).toEqual([...dbChats, ...redisChats].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
      expect(chatRoomModel.aggregate).toHaveBeenCalledTimes(1);
      expect(redisService.getChats).toHaveBeenCalledTimes(1);
    });

    it('✅ Should return only database chats if Redis has no data', async () => {
      const roomId = new mongoose.Types.ObjectId().toHexString();
      const lastCheckTime = new Date();

      const dbChats = [{ id: 'chat1', createdAt: new Date() }];

      chatRoomModel.aggregate.mockResolvedValueOnce(dbChats);
      jest.spyOn(redisService, 'getChats').mockResolvedValueOnce([]);

      const dto: FindChatsDto = { roomId, lastCheckTime };
      const result = await service.findChats(dto);

      expect(result).toEqual(dbChats);
      expect(chatRoomModel.aggregate).toHaveBeenCalledTimes(1);
      expect(redisService.getChats).toHaveBeenCalledTimes(1);
    });

    it('❌ Should throw an exception when a service error occurs', async () => {
      chatRoomModel.aggregate.mockRejectedValueOnce(new Error('Database Error'));

      const dto: FindChatsDto = { roomId: '6603f9bcb2d5a5f8c8a6f2e3', lastCheckTime: new Date() };

      await expect(service.findChats(dto)).rejects.toThrow(new InternalServerErrorException('Failed to fetch chats for room.'));
    });
  });
});