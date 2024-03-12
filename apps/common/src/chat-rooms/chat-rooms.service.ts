import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from 'apps/api/src/users/users.service';
import { ChatRoom } from 'apps/common/src/schemas/chat-room.schema';
import { CreateRoomDto } from 'apps/socket/src/dto/create-room.dto';
import mongoose, { Model } from 'mongoose';

@Injectable()
export class ChatRoomsService {
  constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>,
    private readonly usersService: UsersService,
  ) {}

  findRoom(_id: string) {
    return this.chatRoomModel.findById(_id, { chats: 0 });
  }

  findRoomCanJoin(_id: string, participantId: string) {
    return this.chatRoomModel.findOne(
      {
        _id: new mongoose.Types.ObjectId(_id),
        'participants._id': {
          $ne: new mongoose.Types.ObjectId(participantId),
        },
      },
      {
        chats: 0,
      },
    );
  }

  async createRoom(creatorId: string, dto: CreateRoomDto) {
    const participants = await this.usersService.find([
      creatorId,
      ...dto.participantIds,
    ]);
    return this.chatRoomModel.create({
      name: dto.name,
      participants: participants.map((participant) => ({
        _id: participant._id,
        name: participant.name,
      })),
    });
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

  async exitRoom(_id: string, participantId: string) {
    const result = await this.chatRoomModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(_id),
      },
      {
        $pull: {
          participants: {
            _id: {
              $eq: new mongoose.Types.ObjectId(participantId),
            },
          },
        },
      },
    );

    return result.modifiedCount && result.matchedCount > 0 ? true : false;
  }

  findRoomsParticipated(participantId: string) {
    return this.chatRoomModel.findOne(
      {
        'participants._id': new mongoose.Types.ObjectId(participantId),
      },
      {
        chats: 0,
      },
    );
  }
}
