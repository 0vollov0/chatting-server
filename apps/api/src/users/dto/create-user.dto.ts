import { PickType } from '@nestjs/swagger';
import { User } from 'apps/common/src/schemas/user.schema';

export class CreateUserDto extends PickType(User, [
  'name',
  'password',
] as const) {}
