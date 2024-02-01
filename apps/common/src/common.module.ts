import { Module } from '@nestjs/common';
import { CommonService } from './common.service';

@Module({
  imports: [],
  providers: [CommonService],
})
export class CommonModule {}
