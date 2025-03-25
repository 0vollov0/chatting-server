import { ChatFactory, ChatOnlyMessage, ChatWithBuffer } from './chat-factory';
import { Chat, ChatType, UploadedChatFile } from '@common/schemas/chat.schema';
import { SendChatDto } from '../dto/send-chat.dto';
import { SendChatWithFileDto } from '../dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from '../dto/send-chat-with-image.dto';
import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { GrpcService } from '../grpc/grpc.service';

describe('ChatFactory', () => {
  describe('of()', () => {
    it('✅ Should return ChatOnlyMessage instance for text message', () => {
      const dto: SendChatDto = {
        type: ChatType.message,
        message: 'Hello',
        roomId: '6603f9bcb2d5a5f8c8a6f2e3',
      };
      const chat = ChatFactory.of(dto);
      expect(chat).toBeInstanceOf(ChatOnlyMessage);
    });

    it('✅ Should return ChatWithBuffer instance for file message', () => {
      const dto: SendChatWithFileDto = {
        type: ChatType.file,
        message: 'File message',
        originalname: 'example.pdf',
        buffer: Buffer.from('pdf file'),
        roomId: '6603f9bcb2d5a5f8c8a6f2e3',
      };
      const chat = ChatFactory.of(dto);
      expect(chat).toBeInstanceOf(ChatWithBuffer);
    });

    it('✅ Should return ChatWithBuffer instance for image message', () => {
      const dto: SendChatWithImageDto = {
        type: ChatType.file,
        message: 'image message',
        originalname: 'example.jpg',
        buffer: Buffer.from('image file'),
        roomId: '6603f9bcb2d5a5f8c8a6f2e3',
      };
      const chat = ChatFactory.of(dto);
      expect(chat).toBeInstanceOf(ChatWithBuffer);
    });

    it('❌ Should throw BadRequestException for invalid ChatType', () => {
      const dto = { type: 'invalid_type', message: 'Invalid message' } as any;
      expect(() => ChatFactory.of(dto)).toThrow(BadRequestException);
    });
  });
});

describe('ChatOnlyMessage', () => {
  it('✅ Should create a chat message correctly', async () => {
    const dto: SendChatDto = {
      type: ChatType.message,
      message: 'Hello',
      roomId: '6603f9bcb2d5a5f8c8a6f2e3',
    };
    const chat = new ChatOnlyMessage(dto);
    const result = await chat.process();

    expect(result).toMatchObject({
      type: ChatType.message,
      message: 'Hello',
    });
    expect(result._id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });
});

describe('ChatWithBuffer', () => {
  let uploadMock: jest.Mock;
  let grpcServiceMock: jest.Mocked<GrpcService>;

  beforeEach(() => {
    uploadMock = jest.fn();
    grpcServiceMock = {
      upload: jest.fn(),
    } as unknown as jest.Mocked<GrpcService>;
  });

  it('✅ Should process chat with file upload', async () => {
    const dto: SendChatWithFileDto = {
      type: ChatType.file,
      message: 'File message',
      originalname: 'example.pdf',
      buffer: Buffer.from('pdf file'),
      roomId: '6603f9bcb2d5a5f8c8a6f2e3',
    };
    const uploadedFile: UploadedChatFile = {
      originalname: 'example.pdf',
      filename: 'example123.pdf',
      size: 12345,
      expireAt: new Date(),
    };

    uploadMock.mockResolvedValueOnce(uploadedFile);

    const chat = new ChatWithBuffer(dto);
    chat.adaptUpload(uploadMock);

    const result = await chat.process();

    expect(uploadMock).toHaveBeenCalledWith('file', dto);
    expect(result).toMatchObject({
      ...uploadedFile,
      type: ChatType.file,
      message: 'File message',
    });
    expect(result._id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('✅ Should process chat with image upload', async () => {
    const dto: SendChatWithImageDto = {
      type: ChatType.image,
      message: 'image message',
      originalname: 'example.jpg',
      buffer: Buffer.from('image file'),
      roomId: '6603f9bcb2d5a5f8c8a6f2e3',
    };
    const uploadedFile: UploadedChatFile = {
      originalname: 'example.jpg',
      filename: 'example123.jpg',
      size: 54321,
      expireAt: new Date(),
    };

    uploadMock.mockResolvedValueOnce(uploadedFile);

    const chat = new ChatWithBuffer(dto);
    chat.adaptUpload(uploadMock);

    const result = await chat.process();

    expect(uploadMock).toHaveBeenCalledWith('image', dto);
    expect(result).toMatchObject({
      ...uploadedFile,
      type: ChatType.image,
      message: 'image message',
    });
    expect(result._id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('❌ Should throw InternalServerErrorException if upload function is not defined', async () => {
    const dto: SendChatWithFileDto = {
      type: ChatType.file,
      message: 'File message',
      originalname: 'example.pdf',
      buffer: Buffer.from('pdf file'),
      roomId: '6603f9bcb2d5a5f8c8a6f2e3',
    };
    const chat = new ChatWithBuffer(dto);

    await expect(chat.process()).rejects.toThrow(InternalServerErrorException);
  });

  it('❌ Should throw InternalServerErrorException if file upload fails', async () => {
    const dto: SendChatWithImageDto = {
      type: ChatType.file,
      message: 'image message',
      originalname: 'example.jpg',
      buffer: Buffer.from('image file'),
      roomId: '6603f9bcb2d5a5f8c8a6f2e3',
    };

    uploadMock.mockRejectedValueOnce(new Error('Upload failed'));

    const chat = new ChatWithBuffer(dto);
    chat.adaptUpload(uploadMock);

    await expect(chat.process()).rejects.toThrow(InternalServerErrorException);
  });

  it('✅ Should bind upload function from GrpcService', async () => {
    const dto: SendChatWithFileDto = {
      type: ChatType.file,
      message: 'File message',
      originalname: 'example.pdf',
      buffer: Buffer.from('pdf file'),
      roomId: '6603f9bcb2d5a5f8c8a6f2e3',
    };
    const uploadedFile: UploadedChatFile = {
      originalname: 'example.pdf',
      filename: 'example123.pdf',
      size: 12345,
      expireAt: new Date(),
    };

    grpcServiceMock.upload.mockResolvedValueOnce(uploadedFile);

    const chat = new ChatWithBuffer(dto);
    chat.bindUpload(grpcServiceMock);

    const result = await chat.process();

    expect(grpcServiceMock.upload).toHaveBeenCalledWith('file', dto);
    expect(result).toMatchObject({
      ...uploadedFile,
      type: ChatType.file,
      message: 'File message',
    });
  });
});
