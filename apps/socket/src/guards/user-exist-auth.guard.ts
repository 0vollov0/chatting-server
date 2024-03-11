import { CanActivate, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { TUserPayload } from 'apps/api/src/users/decorators/user.decorator';
import { UsersService } from 'apps/api/src/users/users.service';

@Injectable()
export class UserExistAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(
    context: any,
  ): Promise<boolean | any | Promise<boolean | any>> {
    const token: string = context.args[0].handshake.auth.accessToken;
    try {
      const payload = jwt.verify(
        token,
        this.configService.get<string>('JWT_SECRET'),
        {
          ignoreExpiration: false,
        },
      ) as TUserPayload;
      const user = await this.usersService.findById(payload._id);
      if (!user) return false;
      return true;
    } catch (ex) {
      return false;
    }
  }
}
