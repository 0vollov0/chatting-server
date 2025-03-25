import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from './file.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@common/redis/redis.service';
import * as fs from 'fs';
import { join } from 'path';
import { CreateFileDto } from './dto/create-file.dto';
import { BadRequestException } from '@nestjs/common';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  promises: {
    writeFile: jest.fn(),
  },
}));

describe('FileService', () => {
  let service: FileService;
  let configService: ConfigService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: ConfigService, useValue: { get: jest.fn((key) => (key === 'FILE_EXPIRE_WEEK' ? '4' : '2')) } },
        { provide: RedisService, useValue: { client: { rPush: jest.fn() } } },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
    configService = module.get<ConfigService>(ConfigService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const mockFileDto: CreateFileDto = {
    bufferType: 'file',
    roomId: 'room123',
    filename: 'test-file.txt',
    originalname: 'test-file.txt',
    buffer: Buffer.from('test data'),
  };

  it('✅ Should create and store file successfully', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (redisService.client.rPush as jest.Mock).mockResolvedValue(1);

    const result = await service.createFile(mockFileDto);

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      join(__dirname, '../../..', 'bucket', 'file', 'room123', 'test-file.txt'),
      mockFileDto.buffer,
    );

    expect(redisService.client.rPush).toHaveBeenCalled();
    expect(result).toMatchObject({
      filename: 'test-file.txt',
      originalname: 'test-file.txt',
      size: mockFileDto.buffer.length,
    });
  });

  it('✅ Should create directory if it does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation();

    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (redisService.client.rPush as jest.Mock).mockResolvedValue(1);

    await service.createFile(mockFileDto);

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      join(__dirname, '../../..', 'bucket', 'file', 'room123'),
      { recursive: true }
    );
  });

  it('❌ Should throw BadRequestException if missing required fields', async () => {
    const invalidDto = { ...mockFileDto, buffer: null };

    await expect(service.createFile(invalidDto as any)).rejects.toThrow(BadRequestException);
  });

  it('❌ Should throw BadRequestException if file write fails', async () => {
    (fs.promises.writeFile as jest.Mock).mockRejectedValue(new Error('File write failed'));

    await expect(service.createFile(mockFileDto)).rejects.toThrow(BadRequestException);
    expect(fs.promises.writeFile).toHaveBeenCalled();
  });

  it('❌ Should throw BadRequestException if Redis operation fails', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (redisService.client.rPush as jest.Mock).mockRejectedValue(new Error('Redis error'));

    await expect(service.createFile(mockFileDto)).rejects.toThrow(BadRequestException);
    expect(redisService.client.rPush).toHaveBeenCalled();
  });
});