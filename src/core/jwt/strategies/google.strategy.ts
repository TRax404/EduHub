import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface GoogleValidatedUser {
  email: string;
  providerAccountId: string;
  accessToken: string;
  refreshToken?: string | null;
  idToken?: string | null;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('oauth.GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('oauth.GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('oauth.GOOGLE_CALLBACK_URL'),
      scope: ['openid', 'email', 'profile'],
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email from Google'), false as any);

    const user: GoogleValidatedUser = {
      email,
      providerAccountId: profile.id,
      accessToken,
      refreshToken: refreshToken ?? null,
      idToken: (profile as any)?._json?.id_token ?? null,
    };

    done(null, user);
  }
}