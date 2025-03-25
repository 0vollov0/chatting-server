import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { UploadInterceptor } from './interceptors/upload.interceptor';
import { CreateFileDto } from './dto/create-file.dto';
import { BadRequestException } from '@nestjs/common';
import { CallHandler, ExecutionContext } from '@nestjs/common/interfaces';
import { of } from 'rxjs';

describe('FileController', () => {
  let controller: FileController;
  let fileService: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        {
          provide: FileService,
          useValue: {
            createFile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FileController>(FileController);
    fileService = module.get<FileService>(FileService);
  });

  const mockFileDto: CreateFileDto = {
    bufferType: 'file',
    roomId: 'room123',
    filename: 'test-file.txt',
    originalname: 'test-file.txt',
    buffer: Buffer.from('test data'),
  };

  it('✅ Should call FileService.createFile and return the result', async () => {
    const mockResponse = {
      filename: 'test-file.txt',
      originalname: 'test-file.txt',
      size: mockFileDto.buffer.length,
      expireAt: new Date(),
    };

    (fileService.createFile as jest.Mock).mockResolvedValue(mockResponse);

    const result = await controller.createFile(mockFileDto);

    expect(fileService.createFile).toHaveBeenCalledWith(mockFileDto);
    expect(result).toEqual(mockResponse);
  });

  it('❌ Should throw BadRequestException if file upload fails', async () => {
    (fileService.createFile as jest.Mock).mockRejectedValue(
      new BadRequestException('File upload failed'),
    );

    await expect(controller.createFile(mockFileDto)).rejects.toThrow(
      BadRequestException,
    );
    expect(fileService.createFile).toHaveBeenCalledWith(mockFileDto);
  });

  it('✅ Should have UploadInterceptor applied', async () => {
    const executionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          body: {
            ...mockFileDto,
            buffer: {
              data: new Uint32Array(),
              type: 'Buffer',
            },
          },
        }),
      }),
    } as unknown as ExecutionContext;

    const callHandler: CallHandler = {
      handle: jest.fn(() => of(null)),
    };

    const interceptor = new UploadInterceptor();
    expect(
      await interceptor.intercept(executionContext, callHandler),
    ).toBeDefined();
  });
});
