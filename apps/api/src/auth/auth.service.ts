import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Token } from '@common/schemas/token.schema';
import { Model } from 'mongoose';
import { TUserPayload } from '../users/decorators/user.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User, UserDocument } from '@common/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(Token.name) private readonly tokenModel: Model<Token>,
  ) {}

  async join(dto: CreateUserDto): Promise<User> {
    const user = await this.usersService.create(dto);
    
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  }

  async login(userPayload: TUserPayload) {
    return this.publishToken(userPayload);
  }

  async refreshToken({ _id, accessToken, refreshToken }: RefreshTokenDto) {
    const tokenExists = await this.tokenModel.findOne({ accessToken, refreshToken });
    if (!tokenExists) {
      throw new BadRequestException('Invalid refresh token');
    }

    await this.tokenModel.deleteOne({ accessToken, refreshToken });
    return this.publishToken({ _id });
  }

  validateUser(username: string, password: string) {
    return this.usersService.validate(username, password);
  }

  private async publishToken({ _id }: Pick<TUserPayload, '_id'>) {
    const accessToken = this.jwtService.sign({ _id });
    const refreshToken = this.jwtService.sign({ accessToken }, { expiresIn: '7d' });

    await this.tokenModel.insertOne({ accessToken, refreshToken });

    return { accessToken, refreshToken };
  }
}