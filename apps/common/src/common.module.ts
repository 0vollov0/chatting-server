import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { DatabasesModule } from './databases/databases.module';
import { ConfigModule } from './config/config.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [ConfigModule, DatabasesModule, RedisModule],
  providers: [CommonService],
})
export class CommonModule {}
