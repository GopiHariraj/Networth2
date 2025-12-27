import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    console.log(`[JwtStrategy] Initializing with secret: ${secret ? 'EXISTS' : 'MISSING (Using fallback)'}`);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'super-secret-key',
    });
  }

  async validate(payload: any) {
    console.log('[JwtStrategy] Validating payload:', payload);
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
