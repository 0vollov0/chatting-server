import { Test, TestingModule } from '@nestjs/testing';
import { ChatRoomsController } from './chat-rooms.controller';
import { ChatRoomsService } from './chat-rooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FindChatRoomDto } from './dto/find-chat-room.dto';
import { FindChatsDto } from './dto/find-chats.dto';
import { ExecutionContext } from '@nestjs/common';

describe('ChatRoomsController', () => {
  let controller: ChatRoomsController;
  let chatRoomsService: ChatRoomsService;

  const mockChatRoomsService = {
    find: jest.fn().mockResolvedValue({
      rooms: [
        { id: 'a1c07b1f-2d36-4159-b474-6309469e07b4', name: 'Test Room' },
      ],
    }),
    findChats: jest.fn().mockResolvedValue([
      {
        id: 'b3f52815-14c7-4a7b-bf16-604733959306',
        roomId: 'room1',
        message: 'Hello',
      },
      {
        id: 'acee6b7f-5ed5-442f-900b-d10d6b028147',
        roomId: 'room1',
        message: 'Hi',
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatRoomsController],
      providers: [
        {
          provide: ChatRoomsService,
          useValue: mockChatRoomsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => {
          return true;
        }),
      })
      .compile();

    controller = module.get<ChatRoomsController>(ChatRoomsController);
    chatRoomsService = module.get<ChatRoomsService>(ChatRoomsService);
  });

  it('✅ find() should return a list of chat rooms', async () => {
    const dto: FindChatRoomDto = { page: 1, limit: 10 };
    const result = await controller.find(dto);

    expect(result).toEqual({
      rooms: [
        { id: 'a1c07b1f-2d36-4159-b474-6309469e07b4', name: 'Test Room' },
      ],
    });
    expect(chatRoomsService.find).toHaveBeenCalledWith(dto);
  });

  it('✅ findChats() should return chat logs for a room', async () => {
    const dto: FindChatsDto = { roomId: 'room1', lastCheckTime: new Date() };
    const result = await controller.findChats(dto);

    expect(result).toEqual([
      {
        id: 'b3f52815-14c7-4a7b-bf16-604733959306',
        roomId: 'room1',
        message: 'Hello',
      },
      {
        id: 'acee6b7f-5ed5-442f-900b-d10d6b028147',
        roomId: 'room1',
        message: 'Hi',
      },
    ]);
    expect(chatRoomsService.findChats).toHaveBeenCalledWith(dto);
  });

  it('❌ find() should throw an error if service fails', async () => {
    mockChatRoomsService.find.mockRejectedValueOnce(new Error('Service Error'));

    const dto: FindChatRoomDto = { page: 1, limit: 10 };

    await expect(controller.find(dto)).rejects.toThrow('Service Error');
  });

  it('❌ findChats() should throw an error if service fails', async () => {
    mockChatRoomsService.findChats.mockRejectedValueOnce(
      new Error('Chat Fetch Error'),
    );

    const dto: FindChatsDto = { roomId: 'room1', lastCheckTime: new Date() };

    await expect(controller.findChats(dto)).rejects.toThrow('Chat Fetch Error');
  });
});
