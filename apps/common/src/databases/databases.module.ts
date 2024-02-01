import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
})
export class DatabasesModule {}
