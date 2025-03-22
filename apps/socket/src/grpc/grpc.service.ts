import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from "path";
import { ConfigService } from "@nestjs/config";
import { UploadedChatFile } from "@common/schemas/chat.schema";
import { SendChatWithFileDto } from "../dto/send-chat-with-file.dto";
import { SendChatWithImageDto } from "../dto/send-chat-with-image.dto";
import { BufferType } from "@common/type";
import * as moment from 'moment';

export type UploadFileDto = {
  bufferType: BufferType;
  roomId: string;
  originalname: string;
  buffer: Buffer;
};

export type UploadFileResponse = {
  originalname: string;
  filename: string;
  expireAt: string;
  size: number;
};

interface GrpcClient {
  UploadFile(
    dto: UploadFileDto,
    callback: (error: any, response: UploadFileResponse) => void
  ): void;
}

@Injectable()
export class GrpcService implements OnModuleInit {
  private readonly logger = new Logger(GrpcService.name);
  private client!: GrpcClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    try {
      this.initializeGrpcClient();
      this.logger.log("gRPC Client initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize gRPC Client", error);
    }
  }

  private initializeGrpcClient() {
    const PROTO_PATH = join(__dirname, '../', 'protos', 'file-uploader.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const fileUploaderProto: any = grpc.loadPackageDefinition(packageDefinition).fileUploader;

    this.client = new fileUploaderProto.FileUploader(
      `${this.configService.get<string>('GRPC_HOST', 'localhost')}:${this.configService.get<string>('GRPC_PORT', '50051')}`,
      grpc.credentials.createInsecure()
    );
  }

  async upload(bufferType: BufferType, dto: SendChatWithImageDto | SendChatWithFileDto): Promise<UploadedChatFile> {
    return new Promise<UploadedChatFile>((resolve, reject) => {
      if (!this.client) {
        return reject(new Error("gRPC Client is not initialized"));
      }

      this.client.UploadFile(
        {
          bufferType,
          roomId: dto.roomId,
          originalname: dto.originalname,
          buffer: dto.buffer,
        },
        (error, response) => {
          if (error) {
            this.logger.error("gRPC UploadFile Error:", error);
            return reject(new Error(error.message || "gRPC UploadFile failed"));
          }
          
          resolve({
            filename: response.filename,
            originalname: response.originalname,
            size: response.size,
            expireAt: moment(response.expireAt).toDate(),
          });
        }
      );
    });
  }
}