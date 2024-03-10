import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Token } from 'apps/common/src/schemas/token.schema';
import { Model } from 'mongoose';
import { TUserPayload } from '../users/decorators/user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
  ) {}

  async join(dto: CreateUserDto) {
    try {
      const user: any = await this.usersService.create(dto);
      delete user._doc.password;
      return user;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async login(userPayload: TUserPayload) {
    try {
      const token = this.publishToken(userPayload);
      await this.tokenModel.create(token);
      return token;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  validateUser(username: string, password: string) {
    return this.usersService.validate(username, password);
  }

  private publishToken({ _id }: TUserPayload) {
    const accessToken = this.jwtService.sign({
      _id,
    });
    const refreshToken = this.jwtService.sign(
      {
        accessToken,
      },
      {
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }
}
