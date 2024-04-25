import { Module } from '@nestjs/common';
import { DatabasesModule } from './databases/databases.module';
import { RedisModule } from './redis/redis.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule, DatabasesModule, RedisModule],
})
export class CommonModule {}
