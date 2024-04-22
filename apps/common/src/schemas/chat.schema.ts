import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import mongoose from 'mongoose';

export type UploadedChatFile = {
  originalname: string;
  filename: string;
  size: number;
  expireAt: Date;
};

export enum ChatType {
  message,
  image,
  file,
}

@Schema({
  _id: true,
  timestamps: false,
  autoIndex: false,
  versionKey: false,
  strict: true,
})
export class Chat {
  @ApiProperty({ type: String })
  @Prop({
    type: mongoose.Schema.ObjectId,
    required: true,
    unique: true,
  })
  _id: string;

  @ApiProperty({ enum: ChatType })
  @IsEnum(ChatType)
  @Prop({
    type: Number,
    enum: ChatType,
    required: true,
  })
  type: ChatType;

  /* @ApiProperty({ type: String, maxLength: 64 })
  @Prop({ type: String, maxlength: 64, required: true })
  name: string; */

  @ApiProperty({ type: String, maxLength: 512, required: false })
  @Prop({ type: String, maxlength: 512, required: false })
  message?: string | undefined;

  @ApiProperty({ type: Date })
  @Prop({ type: Date, required: true })
  createdAt: Date;

  @ApiProperty({ type: String, maxLength: 512, required: false })
  @Prop({ type: String, maxlength: 512, required: false })
  originalname?: string | undefined;

  @ApiProperty({ type: String, maxLength: 512, required: false })
  @Prop({ type: String, maxlength: 512, required: false })
  filename?: string | undefined;

  /* @ApiProperty({ type: String, maxLength: 512, required: false })
  @Prop({ type: String, maxlength: 512, required: false })
  url?: string | undefined; */

  @ApiProperty({ type: Number, required: false })
  @Prop({ type: Number, isSafeInteger: true, required: false })
  size?: number | undefined;

  @ApiProperty({ type: Date, required: false })
  @Prop({ type: Date, required: false })
  expireAt?: Date | undefined;
}
export const ChatSchema = SchemaFactory.createForClass(Chat);
