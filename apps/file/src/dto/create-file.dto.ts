export interface CreateFileDto {
  roomId: string;
  buffer: Buffer;
  originalname: string;
  filename: string;
}
