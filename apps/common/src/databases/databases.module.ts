import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabasesService } from './databases.service';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: `mongodb://${configService.get<string>(
          'MONGODB_USER',
        )}:${configService.get<string>(
          'MONGODB_PASSWORD',
        )}@${configService.get<string>(
          'MONGODB_URL',
        )}/${configService.get<string>('MONGODB_DATABASE')}`,
      }),
    }),
  ],
  providers: [DatabasesService],
  exports: [DatabasesService],
})
export class DatabasesModule {}
