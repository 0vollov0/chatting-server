import {
  CanActivate,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { TUserPayload } from 'apps/api/src/users/decorators/user.decorator';
import { WsException } from '@nestjs/websockets';
import { WsArgumentsHost } from '@nestjs/common/interfaces';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: any): boolean {
    try {
      const client = this.getClient(context);
      const token = client.handshake.auth?.accessToken;
      if (!token) {
        throw new UnauthorizedException('Access token is missing');
      }

      this.validateToken(token);
      return true;
    } catch (error) {
      this.logger.warn(`Authentication failed: ${error.message}`);
      throw new WsException(error.message || 'Unauthorized');
    }
  }

  private getClient(context: any) {
    const host: WsArgumentsHost = context.switchToWs();
    return host.getClient();
  }

  private validateToken(token: string): void {
    jwt.verify(token, this.configService.get<string>('JWT_SECRET'), {
      ignoreExpiration: false,
    }) as TUserPayload;
  }
}
