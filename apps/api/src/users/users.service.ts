import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'apps/common/src/schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  create(dto: CreateUserDto) {
    const salt = bcrypt.genSaltSync(10);
    return this.userModel.create({
      name: dto.name,
      password: bcrypt.hashSync(dto.password, salt),
    });
  }

  async validate(name: string, password: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.userModel
        .findOne({ name })
        .then((user) => {
          if (!user) resolve(null);
          else {
            bcrypt
              .compare(password, user.password)
              .then(async (result) => {
                if (result) {
                  resolve(user);
                } else {
                  resolve(null);
                }
              })
              .catch(reject);
          }
        })
        .catch(reject);
    });
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }

  find(ids: string[]) {
    return this.userModel.find({
      _id: {
        $in: ids.map((id) => new mongoose.Types.ObjectId(id)),
      },
    });
  }
}
