import { Injectable, ConflictException, UnauthorizedException, ForbiddenException, BadRequestException, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from './token.service';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { Tokens } from '../interfaces/tokens.interface';
import { ConfigService } from '@nestjs/config';
import { SecurityUtil } from 'src/common/security/security.util';
import { AuthQueueProducer } from 'src/common/queues/producers/auth-queue.producer';
import { AuditSeverity, AuditStatus } from 'src/common/queues/constants/queues.constants';
import { EmailQueueProducer } from 'src/common/queues/producers/email-queue.producer';
import { OtpType } from 'src/common/queues/types/email.type';
import { OTPType } from 'prisma/generated/prisma/client';
import { RedisService } from 'src/common/redis/services/redis.service';

@Injectable()
export class AuthService {
  private readonly dummyPasswordHashPromise = SecurityUtil.hashData(
    'invalid-password',
    true,
  );
  private readonly otpTtlSeconds: number;
  private readonly otpMaxAttempts: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly logger: CustomLoggerService,
    private readonly config: ConfigService,
    private readonly authQueue: AuthQueueProducer,
    private readonly emailQueue: EmailQueueProducer,
    private readonly redisService: RedisService
  ) {
    this.otpTtlSeconds = this.config.get<number>('auth.OTP_TTL_SECONDS', 60);
    this.otpMaxAttempts = this.config.get<number>('auth.OTP_MAX_ATTEMPTS', 5);
  }
  async signup(dto: RegisterDto, ip: string, ua: string): Promise<{ userId: string }> {
    const email = dto.email.toLowerCase();

    // IP Level Rate Limit
    const ipLimit = await this.redisService.rateLimit(`rl:ip:${ip}`, 10, 3600);
    if (!ipLimit.allowed) {
      throw new ForbiddenException('Too many signup attempts from this IP. Please try after an hour.');
    }

    // Email Level Rate Limit: 1 m send mail
    const emailLimit = await this.redisService.rateLimit(`rl:otp:${email}`, 1, 60);
    if (!emailLimit.allowed) {
      throw new BadRequestException(`Please wait ${emailLimit.resetInSeconds}s before requesting another OTP.`);
    }

    // check if user active
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    if (existingUser && existingUser.status === 'ACTIVE') {
      // Timing attack prevention
      await SecurityUtil.hashData(dto.password as any, true).catch(() => { });
      throw new ConflictException('Email already exists and is verified.');
    }

    // ৪. পাসওয়ার্ড হ্যাশ করা
    const passwordHash = await SecurityUtil.hashData(dto.password as any);

    try {
      return await this.prisma.$transaction(async (tx) => {
        let userId: string;

        if (existingUser && existingUser.status === 'PENDING') {
          const updatedUser = await tx.user.update({
            where: { id: existingUser.id },
            data: {
              password: passwordHash,
              authSecurity: { update: { lastLoginIp: ip, lastLoginAt: new Date() } }
            },
            select: { id: true }
          });
          userId = updatedUser.id;
        } else {
          // New user create
          const newUser = await tx.user.create({
            data: {
              email,
              password: passwordHash,
              status: 'PENDING',
              authSecurity: {
                create: { hasPassword: true, lastLoginIp: ip, lastLoginAt: new Date() }
              },
              passwordHistory: { create: { passwordHash } },
            },
            select: { id: true }
          });
          userId = newUser.id;
        }

        // generate otp
        const otp = SecurityUtil.generateOTP(6);
        const otpHash = await SecurityUtil.hashData(otp, false);
        const expiresAt = new Date(Date.now() + this.otpTtlSeconds * 1000);

        await tx.verificationToken.upsert({
          where: { identifier_type: { identifier: email, type: OTPType.EMAIL_VERIFY } },
          update: { token: otpHash, expiresAt, usedAt: null, attempts: 0, userId },
          create: {
            identifier: email,
            token: otpHash,
            type: OTPType.EMAIL_VERIFY,
            expiresAt,
            userId,
          },
        });

        // send mail throw queue
        void this.emailQueue.addOtpEmailJob({
          email,
          otp,
          type: OtpType.REGISTER,
        });

        this.logger.log(`OTP sent to ${email}. Status: PENDING`, 'AuthService');
        return { userId };
      }, { timeout: 15000 });

    } catch (error: any) {
      this.logger.error(`Signup Failed: ${error.message}`, 'AuthService');
      if (error.code === 'P2002') throw new ConflictException('Email already exists');
      throw error;
    }
  }



  async verifyEmailOtp(params: { email: string; otp: string; deviceId: string; ip: string; ua: string }): Promise<Tokens> {
    const email = params.email.toLowerCase();
    const now = new Date();

    const ipLimit = await this.redisService.rateLimit(`verify-ip:${params.ip}`, 10, 3600);
    if (!ipLimit.allowed) {
      throw new ForbiddenException('Too many verification attempts from this IP. Please try later.');
    }

    const emailLimit = await this.redisService.rateLimit(`verify-email:${email}`, 5, 300);
    if (!emailLimit.allowed) {
      throw new ForbiddenException(`Too many verification attempts. Please try in ${emailLimit.resetInSeconds}s.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true, status: true, tokenVersion: true },
      });
      if (!user) throw new UnauthorizedException('Invalid OTP');

      const tokenRow = await tx.verificationToken.findUnique({
        where: { identifier_type: { identifier: email, type: OTPType.EMAIL_VERIFY } },
      });
      if (!tokenRow || tokenRow.usedAt) throw new UnauthorizedException('Invalid OTP');
      if (tokenRow.expiresAt <= now) throw new UnauthorizedException('OTP expired');
      if (tokenRow.attempts >= this.otpMaxAttempts) throw new ForbiddenException('Too many attempts');

      const ok = await SecurityUtil.compareData(params.otp, tokenRow.token, false);
      if (!ok) {
        await tx.verificationToken.update({
          where: { id: tokenRow.id },
          data: { attempts: { increment: 1 } },
        });
        throw new UnauthorizedException('Invalid OTP');
      }

      await tx.verificationToken.update({
        where: { id: tokenRow.id },
        data: { usedAt: now },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      });

      const tokens = await this.tokenService.getTokens(user.id, user.tokenVersion, params.deviceId);
      await this.tokenService.handleSessionUpdate(
        user.id,
        params.deviceId,
        tokens.refreshToken,
        tokens.jti,
        params.ip,
        params.ua,
        tx,
        tokens.family,
      );
      return tokens;
    });
  }



  async requestPasswordResetOtp(emailRaw: string, ip?: string): Promise<void> {
    const email = emailRaw.toLowerCase();

    if (ip) {
      const ipLimit = await this.redisService.rateLimit(`forgot-password-ip:${ip}`, 5, 3600);
      if (!ipLimit.allowed) {
        throw new ForbiddenException('Too many password reset requests from this IP. Please try later.');
      }
    }

    const emailLimit = await this.redisService.rateLimit(`forgot-password-email:${email}`, 1, 120);
    if (!emailLimit.allowed) {
      throw new BadRequestException(`Please wait ${emailLimit.resetInSeconds}s before requesting another OTP.`);
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true },
    });
    // Always respond success (avoid user enumeration)
    if (!user || user.status !== 'ACTIVE') return;

    const otp = SecurityUtil.generateOTP(6);
    const otpHash = await SecurityUtil.hashData(otp, false);
    const expiresAt = new Date(Date.now() + this.otpTtlSeconds * 1000);

    await this.prisma.verificationToken.upsert({
      where: { identifier_type: { identifier: email, type: OTPType.PASSWORD_RESET } },
      update: { token: otpHash, expiresAt, usedAt: null, attempts: 0, userId: user.id },
      create: { identifier: email, token: otpHash, type: OTPType.PASSWORD_RESET, expiresAt, userId: user.id },
    });

    void this.emailQueue.addOtpEmailJob({ email, otp, type: OtpType.FORGOT_PASSWORD });
  }

  async resetPasswordWithOtp(params: { email: string; otp: string; newPassword: string; ip: string; ua: string }): Promise<void> {
    const email = params.email.toLowerCase();
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true, status: true, tokenVersion: true },
      });
      if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Invalid OTP');

      const tokenRow = await tx.verificationToken.findUnique({
        where: { identifier_type: { identifier: email, type: OTPType.PASSWORD_RESET } },
      });
      if (!tokenRow || tokenRow.usedAt) throw new UnauthorizedException('Invalid OTP');
      if (tokenRow.expiresAt <= now) throw new UnauthorizedException('OTP expired');
      if (tokenRow.attempts >= this.otpMaxAttempts) throw new ForbiddenException('Too many attempts');

      const ok = await SecurityUtil.compareData(params.otp, tokenRow.token, false);
      if (!ok) {
        await tx.verificationToken.update({ where: { id: tokenRow.id }, data: { attempts: { increment: 1 } } });
        throw new UnauthorizedException('Invalid OTP');
      }

      await tx.verificationToken.update({ where: { id: tokenRow.id }, data: { usedAt: now } });

      const passwordHash = await SecurityUtil.hashData(params.newPassword, true);
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: passwordHash,
          tokenVersion: { increment: 1 },
          authSecurity: { update: { lastPasswordChange: now } },
          passwordHistory: { create: { passwordHash } },
        },
      });
      // Revoke all sessions after password reset (same transaction)
      await Promise.all([
        tx.refreshToken.updateMany({
          where: { userId: user.id },
          data: { isRevoked: true, revokeReason: 'PASSWORD_RESET', revokedAt: now },
        }),
        tx.session.updateMany({
          where: { userId: user.id },
          data: { isActive: false },
        }),
      ]);
    });
  }



  async changePassword(params: { userId: string; oldPassword: string; newPassword: string }): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, password: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE' || !user.password) throw new UnauthorizedException('Unauthorized');

    const ok = await SecurityUtil.compareData(params.oldPassword, user.password, true);
    if (!ok) throw new BadRequestException('Old password incorrect');

    const passwordHash = await SecurityUtil.hashData(params.newPassword, true);
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: passwordHash,
          tokenVersion: { increment: 1 },
          authSecurity: { update: { lastPasswordChange: now } },
          passwordHistory: { create: { passwordHash } },
        },
      });
      await Promise.all([
        tx.refreshToken.updateMany({
          where: { userId: user.id },
          data: { isRevoked: true, revokeReason: 'PASSWORD_CHANGE', revokedAt: now },
        }),
        tx.session.updateMany({
          where: { userId: user.id },
          data: { isActive: false },
        }),
      ]);
    });
  }




  async login(dto: LoginDto, ip: string, ua: string): Promise<Tokens> {
    const email = dto.email.toLowerCase();

    const ipLimit = await this.redisService.rateLimit(`login-ip:${ip}`, 20, 3600);
    if (!ipLimit.allowed) {
      throw new ForbiddenException('Too many login attempts from this IP. Please try later.');
    }

    const accountLimit = await this.redisService.rateLimit(`login-account:${email}`, 5, 300);
    if (!accountLimit.allowed) {
      throw new ForbiddenException(`Too many login attempts for this account. Please try in ${accountLimit.resetInSeconds}s.`);
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, status: true, tokenVersion: true },
    });

    if (!user) {
      // Keep a comparable code path before returning the explicit missing-account error.
      try {
        const dummyHash = await this.dummyPasswordHashPromise;
        await SecurityUtil.compareData(dto.password, dummyHash, true);
      } catch { }
      throw new NotFoundException('Account not exists');
    }

    if (!user.password) {
      // Timing equalization: compare against a dummy hash so attackers can't easily
      // distinguish “no password” vs “bad password” by response time.
      try {
        const dummyHash = await this.dummyPasswordHashPromise;
        await SecurityUtil.compareData(dto.password, dummyHash, true);
      } catch { }
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== 'ACTIVE') throw new ForbiddenException('Account is not active');

    const ok = await SecurityUtil.compareData(dto.password, user.password, true);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.prisma.$transaction(async (tx) => {
      const tokens = await this.tokenService.getTokens(
        user.id,
        user.tokenVersion,
        dto.deviceId,
      );

      await this.tokenService.handleSessionUpdate(
        user.id,
        dto.deviceId,
        tokens.refreshToken,
        tokens.jti,
        ip,
        ua,
        tx,
        tokens.family,
      );

      // fire-and-forget queue jobs (do not block login)
      void this.authQueue.addLoginHistoryJob({
        userId: user.id,
        ipAddress: ip,
        device: dto.deviceId,
        loginMethod: 'password',
      });

      void this.authQueue.addAuditLogJob({
        userId: user.id,
        action: 'AUTH_LOGIN',
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        ipAddress: ip,
        userAgent: ua,
        metadata: { method: 'password' },
      } as any);

      return tokens;
    });
  }

  /**
   * Google OAuth upsert (email-verified by Google): create/find user and link provider account.
   */
  async loginWithGoogle(params: {
    email: string;
    providerAccountId: string;
    accessToken: string;
    refreshToken?: string | null;
    idToken?: string | null;
    deviceId: string;
    ip: string;
    ua: string;
  }): Promise<Tokens> {
    const email = params.email.toLowerCase();
    const encryptedAccessToken = SecurityUtil.encryptSensitive(params.accessToken);
    const encryptedRefreshToken = params.refreshToken
      ? SecurityUtil.encryptSensitive(params.refreshToken)
      : null;
    const encryptedIdToken = params.idToken
      ? SecurityUtil.encryptSensitive(params.idToken)
      : null;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email },
        update: {
          status: 'ACTIVE',
          role: 'STUDENT',
        },
        create: {
          email,
          status: 'ACTIVE',
          role: 'STUDENT',
          authSecurity: { create: { hasPassword: false, lastLoginIp: params.ip, lastLoginAt: new Date() } },
        },
        select: { id: true, tokenVersion: true },
      });

      await tx.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: params.providerAccountId,
          },
        },
        update: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: params.providerAccountId,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          id_token: encryptedIdToken,
        },
        create: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: params.providerAccountId,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          id_token: encryptedIdToken,
        },
      });

      const tokens = await this.tokenService.getTokens(
        user.id,
        user.tokenVersion,
        params.deviceId,
      );

      await this.tokenService.handleSessionUpdate(
        user.id,
        params.deviceId,
        tokens.refreshToken,
        tokens.jti,
        params.ip,
        params.ua,
        tx,
        tokens.family,
      );

      return tokens;
    });
  }
}
