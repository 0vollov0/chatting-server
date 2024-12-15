import { Injectable } from "@nestjs/common";
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as fs from 'fs';
import { join } from "path";
import { CreateFileDto } from "../dto/create-file.dto";
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { RedisService } from "@common/redis/redis.service";
import { ConfigService } from "@nestjs/config";
import { UploadedChatFile } from "@common/schemas/chat.schema";

@Injectable()
export class GrpcService {
  constructor(
    private readonly configService: ConfigService,
      private readonly redisService: RedisService
  ) {
    this.runServer();
  }

  runServer() {
    const PROTO_PATH = join(__dirname,'protos','file-uploader.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    })

    const fileUploaderProto: any = grpc.loadPackageDefinition(packageDefinition).FileUploaderService;
    const server = new grpc.Server();
    server.addService(fileUploaderProto.service, { UploadFile: this.uploadFile });
    server.bindAsync(
      '0.0.0.0:50051',
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(`gRPC Server running at http://0.0.0.0:${port}`);
      }
    )
  }

  uploadFile(call: { request: CreateFileDto }, callback: any) {
    const {bufferType, roomId, originalname, buffer} = call.request;
    const roomPath = join(
      __dirname,
      '../../..',
      'bucket',
      bufferType,
      roomId,
    );
    if (!fs.existsSync(roomPath)) {
      fs.mkdirSync(roomPath);
      console.log(`${roomPath} has been created.`);
    }
    const filename = `${uuidv4()}.${originalname.split('.')[1]}`;
    fs.writeFile(join(roomPath, filename), buffer, async (err) => {
      if (!err) {
        const expireAt = moment()
          .add(
            bufferType === 'file'
              ? +this.configService.get<string>('FILE_EXPIRE_WEEK')
              : +this.configService.get<string>('IMAGE_EXPIRE_WEEK'),
            'weeks',
          )
          .startOf('hour');
        await this.redisService.client.rPush(
          `expire-${expireAt.toISOString()}`,
          join(bufferType, filename),
        );
        callback(null, {
          filename: filename,
          originalname: originalname,
          expireAt: expireAt.toDate(),
          size: buffer.length,
        })
      }
    });
  }
}