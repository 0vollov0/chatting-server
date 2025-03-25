import { WsException } from '@nestjs/websockets';
import { SendChatDto } from '../dto/send-chat.dto';
import { ChatType } from '@common/schemas/chat.schema';
import { SendChatWithFileDto } from '../dto/send-chat-with-file.dto';
import { SendChatWithImageDto } from '../dto/send-chat-with-image.dto';
import { validateOrReject } from 'class-validator';
import { SendChatValidation } from './send-chat.validation';

jest.mock('class-validator', () => {
  const originalModule = jest.requireActual('class-validator');
  return {
    ...originalModule,
    validateOrReject: jest.fn(),
  };
});
describe('SendChatValidation', () => {
  let pipe: SendChatValidation;

  beforeEach(() => {
    pipe = new SendChatValidation();
  });

  it('✅ Should convert to SendChatDto and pass validation when ChatType is message', async () => {
    const input = { type: ChatType.message, message: 'Hello' };
    (validateOrReject as jest.Mock).mockResolvedValueOnce(undefined); // 유효성 검사 통과

    await expect(pipe.transform(input as SendChatDto)).resolves.toBeInstanceOf(SendChatDto);
    expect(validateOrReject).toHaveBeenCalledTimes(1);
  });

  it('✅ Should convert to SendChatWithFileDto and pass validation when ChatType is file', async () => {
    const input = { type: ChatType.file, fileUrl: 'https://example.com/file.pdf' };
    (validateOrReject as jest.Mock).mockResolvedValueOnce(undefined);

    await expect(pipe.transform(input as unknown as SendChatWithFileDto)).resolves.toBeInstanceOf(SendChatWithFileDto);
    expect(validateOrReject).toHaveBeenCalledTimes(2);
  });

  it('✅ Should convert to SendChatWithImageDto and pass validation when ChatType is image', async () => {
    const input = { type: ChatType.image, imageUrl: 'https://example.com/image.jpg' };
    (validateOrReject as jest.Mock).mockResolvedValueOnce(undefined);

    await expect(pipe.transform(input as unknown as SendChatWithImageDto)).resolves.toBeInstanceOf(SendChatWithImageDto);
    expect(validateOrReject).toHaveBeenCalledTimes(3);
  });

  it('❌ Should throw WsException when an unsupported ChatType is provided', async () => {
    const input = { type: 'unknown_type' };

    await expect(pipe.transform(input as any)).rejects.toThrow(WsException);
    await expect(pipe.transform(input as any)).rejects.toThrow('지원되지 않는 채팅 유형입니다.');
  });

  it('❌ Should throw WsException when validation fails', async () => {
    const input = { type: ChatType.message, message: '' };
    (validateOrReject as jest.Mock).mockRejectedValueOnce(new Error('유효하지 않은 요청입니다.'));

    await expect(pipe.transform(input as SendChatDto)).rejects.toThrow(WsException);
    await expect(pipe.transform(input as SendChatDto)).rejects.toThrow('유효하지 않은 요청입니다.');
  });
});