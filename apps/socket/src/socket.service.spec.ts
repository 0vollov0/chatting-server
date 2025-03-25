import { Test, TestingModule } from '@nestjs/testing';
import { SocketService } from './socket.service';
import { RedisService } from '@common/redis/redis.service';
import { ChatRoomsService } from '@common/chat-rooms/chat-rooms.service';
import { GrpcService } from './grpc/grpc.service';
import { getModelToken } from '@nestjs/mongoose';
import { ChatRoom } from '@common/schemas/chat-room.schema';
import { Server, Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { ChatFactory } from './factories/chat-factory';
import { ChatType } from '@common/schemas/chat.schema';
import { SendChatDto } from './dto/send-chat.dto';

jest.mock('./factories/chat-factory');

describe('SocketService', () => {
  let service: SocketService;
  let redisService: RedisService;
  let chatRoomsService: ChatRoomsService;
  let grpcService: GrpcService;
  let chatRoomModel;
  let server: Server;
  let client: Socket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketService,
        {
          provide: RedisService,
          useValue: { appendChat: jest.fn() },
        },
        {
          provide: ChatRoomsService,
          useValue: {
            createRoom: jest.fn(),
            findRoomCanJoin: jest.fn(),
            exitRoom: jest.fn(),
          },
        },
        {
          provide: GrpcService,
          useValue: {},
        },
        {
          provide: getModelToken(ChatRoom.name),
          useValue: { updateOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SocketService>(SocketService);
    redisService = module.get<RedisService>(RedisService);
    chatRoomsService = module.get<ChatRoomsService>(ChatRoomsService);
    grpcService = module.get<GrpcService>(GrpcService);
    chatRoomModel = module.get(getModelToken(ChatRoom.name));
    server = new Server();
    service.setServer(server);
    client = {
      emit: jest.fn(),
      join: jest.fn(),
      rooms: new Set(),
      handshake: {
        auth: {
          _id: 'client',
        },
      },
    } as unknown as Socket;
  });

  it('✅ should handle chat message', async () => {
    const dto: SendChatDto = {
      roomId: 'room1',
      message: 'test message',
      type: ChatType.message,
    };
    const chatInstance = { process: jest.fn().mockResolvedValue('chat') };
    (ChatFactory.of as jest.Mock).mockReturnValue(chatInstance);

    await service.handleChat(dto);
    expect(redisService.appendChat).toHaveBeenCalledWith('room1', 'chat');
  });

  it('✅ should create a room', async () => {
    const chatRoom: ChatRoom = {
      _id: 'room1',
      name: 'testRoom',
      participants: [],
      createdAt: new Date(),
      chats: [],
    };
    chatRoomsService.createRoom = jest.fn().mockResolvedValue(chatRoom);

    await service.createRoom(client, { name: 'testRoom', participantIds: [] });
    expect(client.join).toHaveBeenCalledWith('room1');
    expect(client.emit).toHaveBeenCalledWith(
      'create-room',
      expect.objectContaining({ _id: 'room1' }),
    );
  });

  it('✅ should join a room', async () => {
    const chatRoom = {
      _id: 'room1',
      name: 'testRoom',
      participants: [],
      createdAt: new Date(),
    };
    chatRoomsService.findRoomCanJoin = jest.fn().mockResolvedValue(chatRoom);
    await service.joinRoom(client, { _id: 'room1' });
    expect(client.join).toHaveBeenCalledWith('room1');
    expect(client.emit).toHaveBeenCalledWith(
      'join-room',
      expect.objectContaining({ _id: 'room1' }),
    );
  });

  it('❌ should throw exception if already joined', async () => {
    client.rooms.add('room1');

    await expect(service.joinRoom(client, { _id: 'room1' })).rejects.toThrow(
      WsException,
    );
  });

  it('✅ should exit a room', async () => {
    chatRoomsService.exitRoom = jest.fn().mockResolvedValue(true);
    client.rooms.add('room1');

    await service.exitRoom(client, { _id: 'room1' });
    expect(client.emit).toHaveBeenCalledWith('exit-room', { _id: 'room1' });
  });

  it('❌ should throw exception if exit room fails', async () => {
    chatRoomsService.exitRoom = jest.fn().mockResolvedValue(false);

    await expect(service.exitRoom(client, { _id: 'room1' })).rejects.toThrow(
      WsException,
    );
  });
});
