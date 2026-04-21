import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRole } from '../../../../prisma/generated/prisma/enums';

export interface JwtPayload {
  sub: string;
  version: number;
  deviceId: string;
  jti: string;
  family: string;
}

export interface AtValidatedUser {
  id: string;
  version: number;
  deviceId: string;
  role: UserRole;
}

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.getOrThrow<string>('jwt.JWT_ACCESS_SECRET');
    const issuer = config.get<string>('jwt.JWT_ISSUER');
    const audience = config.get<string>('jwt.JWT_AUDIENCE');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return (request.cookies as Record<string, string>)?.['access_token'];
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: secret,
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
      ignoreExpiration: false,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AtValidatedUser> {
    if (!payload || !payload.sub || payload.version === undefined) {
      throw new UnauthorizedException('Invalid or empty token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, status: 'ACTIVE' },
      select: { tokenVersion: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer active or exists');
    }

    if (user.tokenVersion !== payload.version) {
      throw new UnauthorizedException(
        'Session expired due to security update. Please log in again.',
      );
    }

    return {
      id: payload.sub,
      version: payload.version,
      deviceId: payload.deviceId,
      role: user.role,
    };
  }
}
