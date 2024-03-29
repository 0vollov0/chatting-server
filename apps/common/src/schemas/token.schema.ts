import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { CommonSchema } from './common.schema';
import { IsJWT } from 'class-validator';

@Schema({
  _id: true,
  timestamps: true,
  autoIndex: true,
  versionKey: false,
  strict: true,
})
export class Token extends CommonSchema {
  @ApiProperty({ type: String })
  @IsJWT()
  @Prop({ type: String })
  accessToken: string;

  @ApiProperty({ type: String })
  @IsJWT()
  @Prop({ type: String })
  refreshToken: string;
}
const TokenSchema = SchemaFactory.createForClass(Token);
TokenSchema.index(
  { accessToken: 1, refreshToken: 1 },
  { unique: true, name: 'token_index' },
);
export { TokenSchema };
