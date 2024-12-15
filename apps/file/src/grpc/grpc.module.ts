import { Module } from '@nestjs/common';
import { GrpcService } from './grpc.service';

@Module({
  providers: [GrpcService],
})
export class GrpcModule {}
