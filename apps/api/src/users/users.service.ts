import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@common/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async create(dto: CreateUserDto) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    return this.userModel.create({
      name: dto.name,
      password: hashedPassword,
    });
  }

  async validate(name: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ name });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async find(ids: string[]): Promise<User[]> {
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    return this.userModel.find({ _id: { $in: objectIds } });
  }
}