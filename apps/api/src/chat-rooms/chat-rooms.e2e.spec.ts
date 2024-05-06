import { Test } from '@nestjs/testing';
import { CommonModule } from '@common/common.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ChatRoomsModule } from './chat-rooms.module';
import { AuthModule } from '../auth/auth.module';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatRoom, ChatRoomSchema } from '@common/schemas/chat-room.schema';
import { FindChatRoomDto } from './dto/find-chat-room.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FindChatsDto } from './dto/find-chats.dto';

describe('ChatRooms', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  let token: string;
  let roomId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ChatRoomsModule,
        CommonModule,
        AuthModule,
        MongooseModule.forFeature([
          {
            name: ChatRoom.name,
            schema: ChatRoomSchema,
          },
        ]),
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
    jwtService = moduleRef.get<JwtService>(JwtService);
    configService = moduleRef.get<ConfigService>(ConfigService);
    token = jwtService.sign({
      _id: configService.get<string>('TEST_USER_ID'),
    });
    roomId = configService.get<string>('TEST_ROOM_ID');
    await app.init();
  });

  it('/GET chat-rooms', () => {
    const query: FindChatRoomDto = {
      page: 1,
      limit: 5,
    };
    return request(app.getHttpServer())
      .get('/chat-rooms')
      .auth(token, {
        type: 'bearer',
      })
      .query(query)
      .expect(200);
  });

  it('/GET chat-rooms/chats', () => {
    const query: FindChatsDto = {
      lastCheckTime: new Date(),
      roomId,
    };
    return request(app.getHttpServer())
      .get('/chat-rooms/chats')
      .auth(token, {
        type: 'bearer',
      })
      .query(query)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
