import { Test, TestingModule } from '@nestjs/testing';
import { GrpcService } from '../grpc/grpc.service';
import { ConfigService } from '@nestjs/config';
import { SendChatWithImageDto } from '../dto/send-chat-with-image.dto';
import { ChatType, UploadedChatFile } from '@common/schemas/chat.schema';
import * as moment from 'moment';

jest.mock('@nestjs/config');

describe('GrpcService', () => {
  let grpcService: GrpcService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrpcService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'GRPC_HOST') return 'localhost';
              if (key === 'GRPC_PORT') return '50051';
              return null;
            }),
          },
        },
      ],
    }).compile();

    grpcService = module.get<GrpcService>(GrpcService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(grpcService).toBeDefined();
  });

  it('should initialize gRPC client on module init', () => {
    grpcService.onModuleInit();
    expect(grpcService).toBeDefined();
  });

  it('should throw error if gRPC client is not initialized', async () => {
    await expect(
      grpcService.upload('image', {
        roomId: 'room1',
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        type: ChatType.image,
      } as SendChatWithImageDto),
    ).rejects.toThrowError('gRPC Client is not initialized');
  });

  it('should call upload function successfully', async () => {
    grpcService.onModuleInit();
    grpcService['client'] = {
      UploadFile: jest.fn((dto, callback) => {
        callback(null, {
          filename: 'uploaded-file.jpg',
          originalname: dto.originalname,
          size: 12345,
          expireAt: moment().toISOString(),
        });
      }),
    } as any;

    const result = await grpcService.upload('image', {
      roomId: 'room1',
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
      type: ChatType.image,
    } as SendChatWithImageDto);

    expect(result).toEqual({
      filename: 'uploaded-file.jpg',
      originalname: 'test.jpg',
      size: 12345,
      expireAt: expect.any(Date),
    });
  });

  it('should handle gRPC upload error correctly', async () => {
    grpcService.onModuleInit();
    grpcService['client'] = {
      UploadFile: jest.fn((dto, callback) => {
        callback(new Error('gRPC Upload Failed'), null);
      }),
    } as any;

    await expect(
      grpcService.upload('image', {
        roomId: 'room1',
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        type: ChatType.image,
      } as SendChatWithImageDto),
    ).rejects.toThrowError('gRPC Upload Failed');
  });
});
