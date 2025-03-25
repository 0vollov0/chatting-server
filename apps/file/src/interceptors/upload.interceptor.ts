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
import { BufferType } from 'apps/common/src/type';
import * as path from 'path';

type Body = {
  buffer: {
    type: 'Buffer';
    data: Uint32Array;
  };
  originalname: string;
  roomId: string;
  bufferType: BufferType;
};

@Injectable()
export class UploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const body: Body = request.body;
    try {
      if (
        !body ||
        !body.originalname ||
        !body.roomId ||
        !body.buffer?.data ||
        !body.bufferType
      ) {
        throw new BadRequestException(
          'Missing required fields: originalname, roomId, buffer, or bufferType.',
        );
      }

      const fileExtension = path.extname(body.originalname);
      if (!fileExtension) {
        throw new BadRequestException(
          'Invalid file name: Missing file extension.',
        );
      }

      let buffer: Buffer;
      try {
        buffer = Buffer.from(body.buffer.data);
      } catch (error) {
        throw new BadRequestException('Invalid buffer data.');
      }

      request.body = {
        originalname: body.originalname,
        buffer,
        filename: `${uuidv4()}${fileExtension}`,
        roomId: body.roomId,
        bufferType: body.bufferType,
      } as CreateFileDto;
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    return next.handle();
  }
}
