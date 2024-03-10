import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { CommonSchema } from './common.schema';

@Schema({
  _id: true,
  timestamps: true,
  autoIndex: true,
  versionKey: false,
  strict: true,
})
export class User extends CommonSchema {
  @ApiProperty({ type: String })
  @Matches(/^[a-zA-Z가-힣][a-zA-Z가-힣0-9]{1,31}$/, {
    message:
      'name should contain only English, Korean, or numbers, starts in English or Korean, and allows up to 2 to 32 characters',
  })
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @ApiProperty({ type: String })
  @Matches(/^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,64}$/, {
    message:
      'password should contain English, numbers, and at least one special character.',
  })
  @Prop({ type: String, required: true })
  password: string;
}
export const UserSchema = SchemaFactory.createForClass(User);
