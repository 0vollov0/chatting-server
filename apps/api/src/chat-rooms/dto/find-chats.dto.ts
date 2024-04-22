import { IsMongoId } from 'class-validator';

export class FindChatsDto {
  @IsMongoId()
  roomId: string;

  @IsMongoId()
  lastChatId: string;
}
