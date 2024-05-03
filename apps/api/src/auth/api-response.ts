import { OmitType, PickType } from '@nestjs/swagger';
import { Token } from '@common/schemas/token.schema';
import { User } from '@common/schemas/user.schema';

export class AuthJoinResponse extends OmitType(User, ['password'] as const) {}
export class AuthLoginResponse extends PickType(Token, [
  'accessToken',
  'refreshToken',
] as const) {}
