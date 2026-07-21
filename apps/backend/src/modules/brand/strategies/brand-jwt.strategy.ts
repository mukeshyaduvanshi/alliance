import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BrandJwtStrategy extends PassportStrategy(Strategy, 'brand-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'brand') {
      throw new UnauthorizedException('Invalid token type');
    }
    return { brandId: payload.brandId, tenantId: payload.tenantId };
  }
}
