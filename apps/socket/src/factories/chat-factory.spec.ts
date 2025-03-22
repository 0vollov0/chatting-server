import { ChatFactory } from '../factories/chat-factory';
import { ChatType, UploadedChatFile } from '@common/schemas/chat.schema';
import { SendChatDto } from '../dto/send-chat.dto';
import { SendChatWithFileDto } from '../dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from '../dto/send-chat-with-image.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { GrpcService } from '../grpc/grpc.service';
import { ConfigModule } from '@common/config/config.module';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

jest.mock('../grpc/grpc.service');

describe('ChatFactory', () => {
    it('should create a ChatOnlyMessage instance for message type', async () => {
    const dto: SendChatDto = {
      type: ChatType.message, 
      message: 'Hello',
      roomId: 'room1'
    };
    const chatInstance = ChatFactory.of(dto);

    expect(chatInstance).toBeDefined();
    const chat = await chatInstance.process();
    expect(chat.type).toBe(ChatType.message);
    expect(chat.message).toBe('Hello');
  });

  it('should create a ChatWithBuffer instance for file type', async () => {
    const dto: SendChatWithFileDto = { type: ChatType.file, message: 'File upload', buffer: Buffer.from('test'), originalname: 'file.jpg', roomId: 'room1' };
    const chatInstance = ChatFactory.of(dto);

    expect(chatInstance).toBeDefined();
    expect(chatInstance).toHaveProperty('adaptUpload');
    expect(chatInstance).toHaveProperty('bindUpload');
  });

  it('should create a ChatWithBuffer instance for image type', async () => {
    const dto: SendChatWithImageDto = { type: ChatType.image, message: 'Image upload', buffer: Buffer.from('test'), originalname: 'file.jpg', roomId: 'room1' };
    const chatInstance = ChatFactory.of(dto);

    expect(chatInstance).toBeDefined();
    expect(chatInstance).toHaveProperty('adaptUpload');
    expect(chatInstance).toHaveProperty('bindUpload');
  });

  it('should throw an error when upload function is not defined in ChatWithBuffer', async () => {
    const dto: SendChatWithFileDto = { type: ChatType.file, message: 'File upload', buffer: Buffer.from('test'), originalname: 'file.jpg', roomId: 'room1' };
    const chatInstance = ChatFactory.of(dto);

    await expect(chatInstance.process()).rejects.toThrow(InternalServerErrorException);
  });

  it('should upload a file successfully in ChatWithBuffer', async () => {
    const dto: SendChatWithFileDto = { type: ChatType.file, message: 'File upload', buffer: Buffer.from('test'), originalname: 'file.jpg', roomId: 'room1' };
    const chatInstance = ChatFactory.of(dto);

    const mockUpload = jest.fn().mockResolvedValue({
      url: 'http://localhost:8082/transformed-file-name.jpg',
      size: 12345,
      originalname: 'file.jpg',
      expireAt: new Date(),
      filename: 'file.jpg'
    } as UploadedChatFile);

    chatInstance.adaptUpload(mockUpload);
    const chat = await chatInstance.process();

    expect(mockUpload).toHaveBeenCalled();
    expect(chat).toHaveProperty('url');
    expect(chat).toHaveProperty('size');
  });

  it('should bind GrpcService upload function', () => {
    const dto: SendChatWithFileDto = { type: ChatType.file, message: 'File upload', buffer: Buffer.from('test'), originalname: 'file.jpg', roomId: 'room1' };
    const chatInstance = ChatFactory.of(dto);
    const grpcService = new GrpcService(new ConfigService());
    grpcService.upload = jest.fn();

    chatInstance.bindUpload(grpcService);
    expect(chatInstance).toHaveProperty('upload');
  });
});
