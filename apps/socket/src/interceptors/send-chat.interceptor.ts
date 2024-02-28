import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class SendChatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const dto = context.switchToWs().getData();
    const client = context.switchToWs().getClient<Socket>();

    try {
      dto.name = client.handshake.auth.name;
    } catch (error) {
      throw new WsException({
        code: 11111,
        message: 'There is no name in the socket.',
      });
    }

    return next.handle().pipe();
  }
}
