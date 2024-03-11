import { CanActivate, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { TUserPayload } from 'apps/api/src/users/decorators/user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: any): boolean | any | Promise<boolean | any> {
    const token: string = context.args[0].handshake.auth.token;
    try {
      jwt.verify(token, this.configService.get<string>('JWT_SECRET'), {
        ignoreExpiration: false,
      }) as TUserPayload;
      return true;
    } catch (ex) {
      return false;
    }
  }
}
