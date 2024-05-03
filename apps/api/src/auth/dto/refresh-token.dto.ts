import { PickType } from '@nestjs/swagger';
import { Token } from '@common/schemas/token.schema';

export class RefreshTokenDto extends PickType(Token, [
  'accessToken',
  'refreshToken',
] as const) {
  _id: string;
}
