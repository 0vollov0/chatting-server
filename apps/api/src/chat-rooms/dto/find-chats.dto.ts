import { ApiProperty } from '@nestjs/swagger';
import { Iso8601Transform } from '@common/transforms/Iso-8601.transform';
import { Transform } from 'class-transformer';
import { IsDate, IsMongoId } from 'class-validator';

export class FindChatsDto {
  @ApiProperty({ type: String })
  @IsMongoId()
  roomId: string;

  @ApiProperty({
    type: Date,
    description:
      'The time that you have checked at the last time as iso 8601 format',
  })
  @Transform(Iso8601Transform)
  @IsDate()
  lastCheckTime: Date;
}
