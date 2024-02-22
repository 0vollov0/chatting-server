import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { CreateFileDto } from '../dto/create-file.dto';
import { v4 as uuidv4 } from 'uuid';

type Body = {
  buffer: {
    type: 'Buffer';
    data: Uint32Array;
  };
  originalname: string;
  roomId: string;
};

@Injectable()
export class UploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const body: Body = request.body;
    try {
      request.body = {
        originalname: body.originalname,
        buffer: Buffer.from(body.buffer.data),
        filename: `${uuidv4()}.${body.originalname.split('.')[1]}`,
        roomId: body.roomId,
      } as CreateFileDto;
    } catch (error) {
      throw new BadRequestException(error);
    }
    return next.handle();
  }
}
