import { OmitType, PickType } from '@nestjs/swagger';
import { Token } from 'apps/common/src/schemas/token.schema';
import { User } from 'apps/common/src/schemas/user.schema';

export class AuthJoinResponse extends OmitType(User, ['password'] as const) {}
export class AuthLoginResponse extends PickType(Token, [
  'accessToken',
  'refreshToken',
] as const) {}
