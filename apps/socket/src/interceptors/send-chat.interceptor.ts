import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class SendChatInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SendChatInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient<Socket>();
    const dto = wsContext.getData();

    const userName = client.handshake.auth?.name;
    if (!userName) {
      this.logger.warn('WebSocket request missing username in handshake');
      throw new WsException({
        code: 11111,
        message: 'Socket handshake is missing the username.',
      });
    }

    Object.assign({ ...dto, name: userName });

    return next.handle().pipe();
  }
}
