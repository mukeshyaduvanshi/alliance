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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
