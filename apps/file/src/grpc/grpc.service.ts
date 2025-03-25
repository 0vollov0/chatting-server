import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';
import { CreateFileDto } from '../dto/create-file.dto';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { RedisService } from '@common/redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GrpcService implements OnModuleInit {
  private FILE_EXPIRE_WEEK: number;
  private IMAGE_EXPIRE_WEEK: number;
  private readonly logger = new Logger(GrpcService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    try {
      this.FILE_EXPIRE_WEEK = +this.configService.get<string>(
        'FILE_EXPIRE_WEEK',
        '4',
      );
      this.IMAGE_EXPIRE_WEEK = +this.configService.get<string>(
        'IMAGE_EXPIRE_WEEK',
        '2',
      );

      if (isNaN(this.FILE_EXPIRE_WEEK) || isNaN(this.IMAGE_EXPIRE_WEEK)) {
        throw new InternalServerErrorException(
          'Invalid expire week configuration.',
        );
      }

      this.runServer();
    } catch (error) {
      this.logger.error(`GrpcService initialization failed: ${error.message}`);
      throw error;
    }
  }

  runServer() {
    try {
      const PROTO_PATH = join(__dirname, 'protos', 'file-uploader.proto');

      if (!fs.existsSync(PROTO_PATH)) {
        throw new InternalServerErrorException(
          `Proto file not found at ${PROTO_PATH}`,
        );
      }

      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const fileUploaderProto: any =
        grpc.loadPackageDefinition(packageDefinition).fileUploader;
      const server = new grpc.Server();

      server.addService(fileUploaderProto.FileUploader.service, {
        UploadFile: this.uploadFile.bind(this),
      });

      server.bindAsync(
        '0.0.0.0:50051',
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
          if (err) {
            this.logger.error(`gRPC server binding failed: ${err.message}`);
            throw new InternalServerErrorException(
              'Failed to start gRPC server.',
            );
          }
          this.logger.log(`gRPC Server running at http://0.0.0.0:${port}`);
        },
      );
    } catch (error) {
      this.logger.error(`Failed to initialize gRPC server: ${error.message}`);
      throw error;
    }
  }

  uploadFile(call: { request: CreateFileDto }, callback: any) {
    const { bufferType, roomId, originalname, buffer } = call.request;

    try {
      if (!bufferType || !roomId || !originalname || !buffer) {
        throw new Error('Missing required file data');
      }

      const roomPath = join(
        __dirname,
        '../../..',
        'bucket',
        bufferType,
        roomId,
      );
      if (!fs.existsSync(roomPath)) {
        fs.mkdirSync(roomPath, { recursive: true });
        this.logger.log(`${roomPath} directory created.`, GrpcService.name);
      }

      const fileExtension = path.extname(originalname);
      if (!fileExtension) {
        throw new Error('Invalid file name: missing extension');
      }

      const filename = `${uuidv4()}${fileExtension}`;
      const filePath = join(roomPath, filename);

      fs.writeFile(filePath, buffer, async (err) => {
        if (err) {
          this.logger.error(`Failed to write file: ${err.message}`);
          callback({
            code: grpc.status.INTERNAL,
            message: 'File write failed',
          });
          return;
        }

        try {
          const expireAt = moment()
            .add(
              bufferType === 'file'
                ? this.FILE_EXPIRE_WEEK
                : this.IMAGE_EXPIRE_WEEK,
              'weeks',
            )
            .startOf('hour');

          await this.redisService.client.rPush(
            `expire-${expireAt.toISOString()}`,
            join(bufferType, filename),
          );

          callback(null, {
            filename,
            originalname,
            expireAt: expireAt.toISOString(),
            size: buffer.length,
          });
        } catch (redisError) {
          this.logger.error(`Redis operation failed: ${redisError.message}`);
          callback({
            code: grpc.status.INTERNAL,
            message: 'Redis operation failed',
          });
        }
      });
    } catch (error) {
      this.logger.error(`UploadFile error: ${error.message}`);
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: error.message,
      });
    }
  }
}
