import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommonSchema } from './common.schema';
import mongoose from 'mongoose';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { User } from './user.schema';

@Schema({
  _id: false,
  timestamps: true,
  versionKey: false,
  strict: true,
})
export class Participant extends OmitType(CommonSchema, ['_id'] as const) {
  @ApiProperty({ type: String })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  _id: mongoose.Schema.Types.ObjectId;

  @ApiProperty({ type: String })
  @Prop({ type: String, required: true })
  name: string;
}
export const ParticipantSchema = SchemaFactory.createForClass(Participant);
