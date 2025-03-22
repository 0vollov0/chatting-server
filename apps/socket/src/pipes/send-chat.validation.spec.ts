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

  it('✅ ChatType.message일 때 SendChatDto로 변환 및 유효성 검사 통과', async () => {
    const input = { type: ChatType.message, message: 'Hello' };
    (validateOrReject as jest.Mock).mockResolvedValueOnce(undefined); // 유효성 검사 통과

    await expect(pipe.transform(input as SendChatDto)).resolves.toBeInstanceOf(SendChatDto);
    expect(validateOrReject).toHaveBeenCalledTimes(1);
  });

  it('✅ ChatType.file일 때 SendChatWithFileDto로 변환 및 유효성 검사 통과', async () => {
    const input = { type: ChatType.file, fileUrl: 'https://example.com/file.pdf' };
    (validateOrReject as jest.Mock).mockResolvedValueOnce(undefined);

    await expect(pipe.transform(input as unknown as SendChatWithFileDto)).resolves.toBeInstanceOf(SendChatWithFileDto);
    expect(validateOrReject).toHaveBeenCalledTimes(2);
  });

  it('✅ ChatType.image일 때 SendChatWithImageDto로 변환 및 유효성 검사 통과', async () => {
    const input = { type: ChatType.image, imageUrl: 'https://example.com/image.jpg' };
    (validateOrReject as jest.Mock).mockResolvedValueOnce(undefined);

    await expect(pipe.transform(input as unknown as SendChatWithImageDto)).resolves.toBeInstanceOf(SendChatWithImageDto);
    expect(validateOrReject).toHaveBeenCalledTimes(3);
  });

  it('❌ 지원되지 않는 ChatType일 경우 WsException 발생', async () => {
    const input = { type: 'unknown_type' };

    await expect(pipe.transform(input as any)).rejects.toThrow(WsException);
    await expect(pipe.transform(input as any)).rejects.toThrow('지원되지 않는 채팅 유형입니다.');
  });

  it('❌ 유효성 검사 실패 시 WsException 발생', async () => {
    const input = { type: ChatType.message, message: '' };
    (validateOrReject as jest.Mock).mockRejectedValueOnce(new Error('유효하지 않은 요청입니다.'));

    await expect(pipe.transform(input as SendChatDto)).rejects.toThrow(WsException);
    await expect(pipe.transform(input as SendChatDto)).rejects.toThrow('유효하지 않은 요청입니다.');
  });
});