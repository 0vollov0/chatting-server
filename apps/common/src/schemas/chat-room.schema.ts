import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './chat.schema';
import { IsMongoId, Length } from 'class-validator';
import { Participant, ParticipantSchema } from './participant.schema';

@Schema({
  _id: true,
  timestamps: false,
  autoIndex: true,
  versionKey: false,
  strict: true,
})
export class ChatRoom {
  @IsMongoId()
  _id: string;

  @Length(2, 64)
  @Prop({ type: String, required: true, maxlength: 64 })
  name: string;

  @Prop({ type: [ParticipantSchema], default: [] })
  participants: Participant[];

  @Prop({ type: [ChatSchema], default: [] })
  chats: Chat[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}
const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
export { ChatRoomSchema };
