import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VendorJwtStrategy extends PassportStrategy(
  Strategy,
  'vendor-jwt',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'vendor')
      throw new UnauthorizedException('Invalid token type');
    return {
      vendorId: payload.vendorId,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email,
    };
  }
}
