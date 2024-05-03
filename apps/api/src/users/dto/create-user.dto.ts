import { PickType } from '@nestjs/swagger';
import { User } from '@common/schemas/user.schema';

export class CreateUserDto extends PickType(User, [
  'name',
  'password',
] as const) {}
