import { Test, TestingModule } from '@nestjs/testing';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@api/users/users.service';
import { ChatRoomsService } from '@common/chat-rooms/chat-rooms.service';
import { UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { SendChatDto } from './dto/send-chat.dto';
import { ChatType } from '@common/schemas/chat.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { ExitRoomDto } from './dto/exit-room.dto';

describe('SocketGateway', () => {
  let gateway: SocketGateway;
  let socketService: SocketService;
  let configService: ConfigService;
  let usersService: UsersService;
  let chatRoomsService: ChatRoomsService;

  let mockServer: Server;
  let mockSocket: Socket;

  const mockUser = {
    _id: '6603f9bcb2d5a5f8c8a6f2e3',
    name: 'Test User',
  };

  const mockToken = 'mockAccessToken';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketGateway,
        {
          provide: SocketService,
          useValue: {
            setServer: jest.fn(),
            handleChat: jest.fn(),
            createRoom: jest.fn(),
            joinRoom: jest.fn(),
            exitRoom: jest.fn(),
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('mockSecret') } },
        { provide: UsersService, useValue: { findById: jest.fn().mockResolvedValue(mockUser) } },
        { provide: ChatRoomsService, useValue: { findRoomsParticipated: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();

    gateway = module.get<SocketGateway>(SocketGateway);
    socketService = module.get<SocketService>(SocketService);
    configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);
    chatRoomsService = module.get<ChatRoomsService>(ChatRoomsService);

    mockServer = {
      emit: jest.fn(),
    } as unknown as Server;

    mockSocket = {
      handshake: { auth: { accessToken: mockToken } },
      join: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as Socket;

    gateway.server = mockServer;
  });

  describe('afterInit()', () => {
    it('✅ Should set the server in the SocketService', () => {
      gateway.afterInit(mockServer);
      expect(socketService.setServer).toHaveBeenCalledWith(mockServer);
    });
  });

  describe('handleConnection()', () => {
    it('✅ Should successfully connect a client with a valid token', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ _id: mockUser._id } as any);
      await gateway.handleConnection(mockSocket);

      expect(usersService.findById).toHaveBeenCalledWith(mockUser._id);
      expect(gateway.clients.has(mockUser._id)).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledTimes(0);
    });

    it('❌ Should disconnect a client with an invalid token', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new UnauthorizedException();
      });

      await gateway.handleConnection(mockSocket);
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('❌ Should disconnect a client if the user is not found', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ _id: 'invalidUserId' } as any);
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      await gateway.handleConnection(mockSocket);
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDisconnect()', () => {
    it('✅ Should remove client from the map and disconnect properly', () => {
      gateway.clients.set(mockUser._id, mockSocket);
      mockSocket.handshake.auth._id = mockUser._id;

      gateway.handleDisconnect(mockSocket);

      expect(gateway.clients.has(mockUser._id)).toBe(false);
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('✅ Should handle cases where client does not have a valid user ID', () => {
      mockSocket.handshake.auth = {};
      gateway.handleDisconnect(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleChat()', () => {
    it('✅ Should process a chat message', () => {
      const chatDto: SendChatDto = {
        message: 'Hello World',
        roomId: '6603f9bcb2d5a5f8c8a6f2e3',
        type: ChatType.message
      };
      gateway.handleChat(chatDto);
      expect(socketService.handleChat).toHaveBeenCalledWith(chatDto);
    });
  });

  describe('createRoom()', () => {
    it('✅ Should create a new chat room', () => {
      const createRoomDto: CreateRoomDto = {
        name: 'New Room',
        participantIds: []
      };
      gateway.createRoom(createRoomDto, mockSocket);
      expect(socketService.createRoom).toHaveBeenCalledWith(mockSocket, createRoomDto);
    });
  });

  describe('joinRoom()', () => {
    it('✅ Should allow a user to join a room', () => {
      const joinRoomDto: JoinRoomDto = {
        _id: '6603f9bcb2d5a5f8c8a6f2e3'
      };
      gateway.joinRoom(joinRoomDto, mockSocket);
      expect(socketService.joinRoom).toHaveBeenCalledWith(mockSocket, joinRoomDto);
    });
  });

  describe('exitRoom()', () => {
    it('✅ Should allow a user to exit a room', () => {
      const exitRoomDto: ExitRoomDto = { 
        _id: '6603f9bcb2d5a5f8c8a6f2e3'
      };
      gateway.exitRoom(exitRoomDto, mockSocket);
      expect(socketService.exitRoom).toHaveBeenCalledWith(mockSocket, exitRoomDto);
    });
  });
});