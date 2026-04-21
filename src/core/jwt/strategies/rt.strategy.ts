import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  version: number;
  deviceId: string;
  jti: string;
  family: string;
}

interface RtValidatedUser extends JwtPayload {
  refreshToken: string;
}

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    const opts: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return (request.cookies as Record<string, string>)?.['refresh_token'];
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.getOrThrow<string>('jwt.JWT_REFRESH_SECRET'),
      passReqToCallback: true,
      algorithms: ['HS256'],
    };
    super(opts);
  }

  validate(req: Request, payload: JwtPayload): RtValidatedUser {
    const authHeader = req.get('authorization');
    const bearer =
      authHeader && /^Bearer\s+/i.test(authHeader)
        ? authHeader.replace(/^Bearer\s+/i, '').trim()
        : undefined;
    const refreshToken =
      bearer || (req.cookies as Record<string, string>)?.['refresh_token'];

    if (!refreshToken) throw new ForbiddenException('Refresh token malformed');

    return {
      ...payload,
      refreshToken,
    };
  }
}
