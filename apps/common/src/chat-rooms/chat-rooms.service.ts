import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ChatRoom } from 'apps/common/src/schemas/chat-room.schema';
import { Model } from 'mongoose';

@Injectable()
export class ChatRoomsService {
  constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>,
  ) {}

  findRoom(_id: string) {
    return this.chatRoomModel.findById(_id);
  }

  createRoom(name: string) {
    return this.chatRoomModel.create({ name });
  }

  searchRoom(name: string) {
    return this.chatRoomModel.findOne({ name }, { chats: 0 });
  }

  searchRooms(search: string) {
    return this.chatRoomModel.find(
      { name: { $regex: search, $options: 'i' } },
      { chats: 0 },
    );
  }
}
