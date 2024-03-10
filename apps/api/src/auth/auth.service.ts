import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async join(dto: CreateUserDto) {
    try {
      const user: any = await this.usersService.create(dto);
      delete user._doc.password;
      return user;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  validateUser(username: string, password: string) {
    return this.usersService.validate(username, password);
  }
}
