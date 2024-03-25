import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './chat.schema';
import { IsMongoId, Length } from 'class-validator';
import { Participant, ParticipantSchema } from './participant.schema';
import { ApiProperty } from '@nestjs/swagger';

@Schema({
  _id: true,
  timestamps: false,
  autoIndex: true,
  versionKey: false,
  strict: true,
})
export class ChatRoom {
  @ApiProperty({ type: String })
  @IsMongoId()
  _id: string;

  @ApiProperty({ type: String })
  @Length(2, 64)
  @Prop({ type: String, required: true, maxlength: 64 })
  name: string;

  @ApiProperty({ type: Participant, isArray: true })
  @Prop({ type: [ParticipantSchema], default: [] })
  participants: Participant[];

  @ApiProperty({ type: Chat, isArray: true })
  @Prop({ type: [ChatSchema], default: [] })
  chats: Chat[];

  @ApiProperty({ type: Date })
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}
const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
export { ChatRoomSchema };
