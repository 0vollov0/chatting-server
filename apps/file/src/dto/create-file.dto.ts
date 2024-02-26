import { BufferType } from 'apps/common/src/type';

export interface CreateFileDto {
  roomId: string;
  buffer: Buffer;
  originalname: string;
  filename: string;
  bufferType: BufferType;
}
