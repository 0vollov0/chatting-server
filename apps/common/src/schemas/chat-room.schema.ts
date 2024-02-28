import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './chat.schema';

@Schema({
  _id: true,
  timestamps: false,
  autoIndex: true,
  versionKey: false,
  strict: true,
})
export class ChatRoom {
  @Prop({ type: [ChatSchema], default: [] })
  chats: Chat[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}
export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
