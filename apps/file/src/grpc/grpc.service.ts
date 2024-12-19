import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as fs from 'fs';
import { join } from "path";
import { CreateFileDto } from "../dto/create-file.dto";
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { RedisService } from "@common/redis/redis.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GrpcService implements OnModuleInit {
  private FILE_EXPIRE_WEEK: number;
  private IMAGE_EXPIRE_WEEK: number;
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    this.FILE_EXPIRE_WEEK = +this.configService.get<string>('FILE_EXPIRE_WEEK');
    this.IMAGE_EXPIRE_WEEK = +this.configService.get<string>('IMAGE_EXPIRE_WEEK')
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

    const fileUploaderProto: any = grpc.loadPackageDefinition(packageDefinition).fileUploader;
    const server = new grpc.Server();
    server.addService(fileUploaderProto.FileUploader.service, { UploadFile: this.uploadFile.bind(this) });
    server.bindAsync(
      '0.0.0.0:50051',
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          Logger.error(err, 'gRPC Server');
          return;
        }
        Logger.log(`Running at http://0.0.0.0:${port}`, 'gRPC Server')
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
      Logger.log(`${roomPath} has been created.`, this.constructor.name);
    }
    const filename = `${uuidv4()}.${originalname.split('.')[1]}`;
    fs.writeFile(join(roomPath, filename), buffer, async (err) => {
      if (!err) {
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
          filename: filename,
          originalname: originalname,
          expireAt: moment().toISOString(),
          size: buffer.length,
        })
      }
    });
  }
}