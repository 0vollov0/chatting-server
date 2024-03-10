import { ApiProperty } from '@nestjs/swagger';

export class CommonSchema {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
