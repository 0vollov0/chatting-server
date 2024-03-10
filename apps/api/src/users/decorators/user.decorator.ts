import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Me = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    delete request.user._doc.password;
    return request.user;
  },
);
