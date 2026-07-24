import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModulea } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { WorkflowRuleModule } from './modules/workflow-rule/workflow-rule.module';
import { WorkflowInstanceModule } from './modules/workflow-instance/workflow-instance.module';
import { BrandModule } from './modules/brand/brand.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { SystemAdminModule } from './modules/system-admin/system-admin.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuditLogModule } from './modules/audit-log/audit-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModulea,
    RoleModule,
    PermissionModule,
    WorkflowRuleModule,
    WorkflowInstanceModule,
    BrandModule,
    ProductModule,
    OrderModule,
    PurchaseOrderModule,
    VendorModule,
    ScheduleModule.forRoot(),
    MonitoringModule,
    SystemAdminModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
