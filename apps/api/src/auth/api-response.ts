import { OmitType } from '@nestjs/swagger';
import { User } from 'apps/common/src/schemas/user.schema';

export class AuthJoinResponse extends OmitType(User, ['password']) {}
