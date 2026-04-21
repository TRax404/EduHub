import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './jwt.constants';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;
    return super.canActivate(context) as Promise<boolean>;
  }

  override handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (info) {
      const request = context.switchToHttp().getRequest<Request>();
      const hasCookie = !!(request.cookies as Record<string, string>)?.[
        'access_token'
      ];
      const hasAuthHeader = !!request.headers['authorization'];

      const infoMessage = info instanceof Error ? info.message : String(info);
      console.error(`[AuthGuard] Error: ${infoMessage}`);
      console.log(
        `[AuthGuard] Credentials Found - Cookie: ${hasCookie}, Header: ${hasAuthHeader}`,
      );
    }
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Authentication failed: Please login to access this resource',
        )
      );
    }

    return user;
  }
}
