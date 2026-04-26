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

    const authHeader = req.get('authorization');
    const hasBearerToken =
      typeof authHeader === 'string' && /^Bearer\s+\S+/i.test(authHeader);

    // Explicit bearer-token requests are not susceptible to browser-driven CSRF
    // in the same way cookie-authenticated requests are.
    if (hasBearerToken) return true;

    const csrfCookie = (req.cookies as Record<string, string>)['csrf_token'];
    const csrfHeader = req.get('x-csrf-token');

    if (!csrfCookie || csrfCookie !== csrfHeader) {
      throw new ForbiddenException('CSRF blocked');
    }
    return true;
  }
}
