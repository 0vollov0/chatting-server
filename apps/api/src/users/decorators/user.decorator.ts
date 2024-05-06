import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@common/schemas/user.schema';

export type TUserPayload = Pick<User, '_id' | 'createdAt' | 'updatedAt'>;

export const UserPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    delete request.user._doc.password;
    return request.user;
  },
);
