import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { BrandRegistrationController } from './brand-registration.controller';
import { BrandAuthController } from './brand-auth.controller';
import { BrandJwtStrategy } from './strategies/brand-jwt.strategy';
import { WorkflowInstanceModule } from '../workflow-instance/workflow-instance.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    WorkflowInstanceModule,
    AuditLogModule,
  ],
  controllers: [
    BrandController,
    BrandRegistrationController,
    BrandAuthController,
  ],
  providers: [BrandService, BrandJwtStrategy],
})
export class BrandModule {}
