import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StartWorkflowDto } from './dto/start-workflow.dto';

@Injectable()
export class WorkflowInstanceService {
  constructor(private prisma: PrismaService) {}

  async start(tenantId: string, dto: StartWorkflowDto, initiatedById: string) {
    const rule = await this.prisma.workflowRule.findFirst({
      where: { tenantId, module: dto.module, isActive: true, deletedAt: null },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    if (!rule) {
      throw new NotFoundException(
        'No active workflow configured for this module',
      );
    }

    if (rule.autoApprove || rule.steps.length === 0) {
      return this.prisma.workflowInstance.create({
        data: {
          tenantId,
          workflowRuleId: rule.id,
          entityType: dto.entityType,
          entityId: dto.entityId,
          initiatedById,
          status: 'APPROVED',
          currentStepOrder: 0,
        },
      });
    }

    return this.prisma.workflowInstance.create({
      data: {
        tenantId,
        workflowRuleId: rule.id,
        entityType: dto.entityType,
        entityId: dto.entityId,
        initiatedById,
        status: 'PENDING',
        currentStepOrder: 1,
      },
    });
  }

  async findAll(tenantId: string, status?: string) {
    return this.prisma.workflowInstance.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      include: { workflowRule: true, actions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const instance = await this.prisma.workflowInstance.findFirst({
      where: { id, tenantId },
      include: {
        workflowRule: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
        actions: {
          include: { actionByUser: true, workflowStep: true },
          orderBy: { createdAt: 'asc' },
        },
        initiatedBy: true,
      },
    });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    return instance;
  }

  async getPending(tenantId: string, userRoleId: string) {
    const instances = await this.prisma.workflowInstance.findMany({
      where: { tenantId, status: 'PENDING' },
      include: { workflowRule: { include: { steps: true } } },
    });

    // Filter to instances where the CURRENT step's approver role matches this user's role
    return instances.filter((instance) => {
      const currentStep = instance.workflowRule.steps.find(
        (s) => s.stepOrder === instance.currentStepOrder,
      );
      return currentStep?.approverRoleId === userRoleId;
    });
  }

  private async getCurrentStep(workflowRuleId: string, stepOrder: number) {
    return this.prisma.workflowStep.findFirst({
      where: { workflowRuleId, stepOrder },
    });
  }

  async approve(
    tenantId: string,
    instanceId: string,
    userId: string,
    userRoleId: string,
    remarks?: string,
  ) {
    const instance = await this.getActiveInstance(tenantId, instanceId);
    const currentStep = await this.getCurrentStep(
      instance.workflowRuleId,
      instance.currentStepOrder,
    );

    if (!currentStep) throw new BadRequestException('Invalid workflow state');
    if (currentStep.approverRoleId !== userRoleId) {
      throw new ForbiddenException('You are not the approver for this step');
    }

    await this.prisma.approvalAction.create({
      data: {
        workflowInstanceId: instance.id,
        workflowStepId: currentStep.id,
        actionByUserId: userId,
        decision: 'APPROVED',
        remarks,
      },
    });

    const nextStep = await this.getCurrentStep(
      instance.workflowRuleId,
      instance.currentStepOrder + 1,
    );

    return this.prisma.workflowInstance.update({
      where: { id: instance.id },
      data: nextStep
        ? { currentStepOrder: instance.currentStepOrder + 1 }
        : { status: 'APPROVED' },
    });
  }

  async reject(
    tenantId: string,
    instanceId: string,
    userId: string,
    userRoleId: string,
    remarks?: string,
  ) {
    const instance = await this.getActiveInstance(tenantId, instanceId);
    const currentStep = await this.getCurrentStep(
      instance.workflowRuleId,
      instance.currentStepOrder,
    );

    if (!currentStep) throw new BadRequestException('Invalid workflow state');
    if (currentStep.approverRoleId !== userRoleId) {
      throw new ForbiddenException('You are not the approver for this step');
    }

    await this.prisma.approvalAction.create({
      data: {
        workflowInstanceId: instance.id,
        workflowStepId: currentStep.id,
        actionByUserId: userId,
        decision: 'REJECTED',
        remarks,
      },
    });

    return this.prisma.workflowInstance.update({
      where: { id: instance.id },
      data: { status: 'REJECTED' },
    });
  }

  private async getActiveInstance(tenantId: string, id: string) {
    const instance = await this.prisma.workflowInstance.findFirst({
      where: { id, tenantId },
    });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    if (instance.status !== 'PENDING') {
      throw new BadRequestException(
        'This workflow instance is no longer pending',
      );
    }
    return instance;
  }
}
