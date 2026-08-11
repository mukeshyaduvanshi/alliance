import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPagination,
  type Paginated,
} from '../../common/pagination';
import { StartWorkflowDto } from './dto/start-workflow.dto';

@Injectable()
export class WorkflowInstanceService {
  constructor(private prisma: PrismaService) {}

  async start(tenantId: string, dto: StartWorkflowDto, initiatedById?: string) {
    const rule = await this.prisma.workflowRule.findFirst({
      where: { tenantId, module: dto.module, isActive: true, deletedAt: null },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    if (!rule) {
      throw new NotFoundException(
        'No active workflow configured for this module',
      );
    }

    if (rule.autoApprove) {
      return this.prisma.workflowInstance.create({
        data: {
          tenantId,
          workflowRuleId: rule.id,
          entityType: dto.entityType,
          entityId: dto.entityId,
          initiatedById: initiatedById ?? null,
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
        initiatedById: initiatedById ?? null,
        status: 'PENDING',
        currentStepOrder: rule.steps.length > 0 ? 1 : 0,
      },
    });
  }

  async findAll(
    tenantId: string,
    status?: string,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = {
      tenantId,
      ...(status ? { status: status as any } : {}),
    };

    const [instances, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where,
        include: { workflowRule: true, actions: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.workflowInstance.count({ where }),
    ]);

    return buildPaginated(instances, total, p, size);
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

  async getPending(
    tenantId: string,
    userRoleId: string,
    assignedBrandIds: string[] = [],
    page?: string | number,
    pageSize?: string | number,
  ) {
    const { page: p, pageSize: size } = getPagination(page, pageSize);

    const instances = await this.prisma.workflowInstance.findMany({
      where: { tenantId, status: 'PENDING' },
      include: { workflowRule: { include: { steps: true } } },
    });

    // Filter to instances where the CURRENT step's approver role matches this user's role
    // AND (optionally) the entity belongs to one of the user's assigned brands
    const filtered = instances.filter((instance) => {
      const currentStep = instance.workflowRule.steps.find(
        (s) => s.stepOrder === instance.currentStepOrder,
      );
      const isRoleMatch = currentStep?.approverRoleId === userRoleId;
      if (!isRoleMatch) return false;
      if (assignedBrandIds.length === 0) return true;

      if (instance.entityType === 'Brand') {
        return assignedBrandIds.includes(instance.entityId);
      }
      return true;
    });

    const total = filtered.length;
    const start = (p - 1) * size;

    return buildPaginated(filtered.slice(start, start + size), total, p, size);
  }

  async escalate(
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

    if (!currentStep) {
      throw new BadRequestException('Invalid workflow state');
    }

    await this.prisma.approvalAction.create({
      data: {
        workflowInstanceId: instance.id,
        workflowStepId: currentStep.id,
        actionByUserId: userId,
        decision: 'ESCALATED',
        remarks,
      },
    });

    return this.prisma.workflowInstance.update({
      where: { id: instance.id },
      data: {
        escalatedByRoleId: userRoleId,
        escalatedAt: new Date(),
      },
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

    if (currentStep) {
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
    }

    const nextStep = currentStep
      ? await this.getCurrentStep(
          instance.workflowRuleId,
          instance.currentStepOrder + 1,
        )
      : null;

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

    if (currentStep) {
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
    }

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
