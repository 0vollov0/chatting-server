import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { CommonSchema } from './common.schema';
import { IsJWT } from 'class-validator';
import { Document } from 'mongoose';

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
export type TokenDocument = Document<unknown, object, Token> &
  Token &
  Required<{
    _id: string;
  }>;
export { TokenSchema };
