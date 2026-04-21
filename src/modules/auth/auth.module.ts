import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../..//prisma/prisma.module';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { TokenService } from './service/token.service';
import { AtStrategy } from '../../core/jwt/strategies/at.strategy';
import { RtStrategy } from '../../core/jwt/strategies/rt.strategy';
import { GoogleStrategy } from '../../core/jwt/strategies/google.strategy';
import { AtGuard } from '../../core/jwt/guards/at.guard';
import { RtGuard } from '../../core/jwt/guards/rt.guard';
import { RedisService } from 'src/common/redis/services/redis.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    AtStrategy,
    RtStrategy,
    GoogleStrategy,
    AtGuard,
    RtGuard,
    RedisService
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule { }
