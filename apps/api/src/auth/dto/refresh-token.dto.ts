import { PickType } from '@nestjs/swagger';
import { Token } from 'apps/common/src/schemas/token.schema';

export class RefreshTokenDto extends PickType(Token, [
  'accessToken',
  'refreshToken',
] as const) {
  _id: string;
}
