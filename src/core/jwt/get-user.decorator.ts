import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestUser extends Record<string, unknown> {
  id?: string;
  sub?: string;
  email?: string;
  deviceId?: string;
  version?: number;
}

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();

    const user = request.user;
    if (!user) return null;

    if (data) {
      return user[data];
    }
    return user;
  },
);
