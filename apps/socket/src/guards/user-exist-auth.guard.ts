import {
  CanActivate,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { TUserPayload } from 'apps/api/src/users/decorators/user.decorator';
import { UsersService } from '@api/users/users.service';
import { WsException } from '@nestjs/websockets';
import { WsArgumentsHost } from '@nestjs/common/interfaces';

@Injectable()
export class UserExistAuthGuard implements CanActivate {
  private readonly logger = new Logger(UserExistAuthGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: any): Promise<boolean> {
    try {
      const client = this.getClient(context);
      const token = client.handshake.auth?.accessToken;
      if (!token) throw new UnauthorizedException('Access token is missing');

      const payload = this.decodeToken(token);
      const user = await this.usersService.findById(payload._id);

      if (!user) {
        this.logger.warn(
          `Unauthorized access attempt: user ${payload._id} not found`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw new WsException(error.message || 'Unauthorized');
    }
  }

  private getClient(context: any) {
    const host: WsArgumentsHost = context.switchToWs();
    return host.getClient();
  }

  private decodeToken(token: string): TUserPayload {
    return jwt.verify(token, this.configService.get<string>('JWT_SECRET'), {
      ignoreExpiration: false,
    }) as TUserPayload;
  }
}
