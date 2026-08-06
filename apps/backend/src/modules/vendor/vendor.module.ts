import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { WorkflowInstanceModule } from '../workflow-instance/workflow-instance.module';
import { OrderModule } from '../order/order.module';
import { VendorController } from './vendor.controller';
import { VendorRegistrationController } from './vendor-registration.controller';
import { VendorAuthController } from './vendor-auth.controller';
import { VendorRateController } from './vendor-rate.controller';
import { VendorOrderController } from './vendor-order.controller';
import { VendorService } from './vendor.service';
import { VendorRateService } from './vendor-rate.service';
import { VendorJwtStrategy } from './strategies/vendor-jwt.strategy';
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
    OrderModule,
    AuditLogModule,
  ],
  controllers: [
    VendorController,
    VendorRegistrationController,
    VendorAuthController,
    VendorRateController,
    VendorOrderController,
  ],
  providers: [VendorService, VendorRateService, VendorJwtStrategy],
})
export class VendorModule {}
