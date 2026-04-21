import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();

    if (req.method === 'GET') return true;

    const csrfCookie = (req.cookies as Record<string, string>)['csrf_token'];
    const csrfHeader = req.headers['x-csrf-token'];

    if (!csrfCookie || csrfCookie !== csrfHeader) {
      throw new ForbiddenException('CSRF blocked');
    }
    return true;
  }
}
