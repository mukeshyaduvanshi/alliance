import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPagination,
  type Paginated,
} from '../../common/pagination';
import { CreateWorkflowRuleDto } from './dto/create-workflow-rule.dto';
import { UpdateWorkflowRuleDto } from './dto/update-workflow-rule.dto';
import { CreateWorkflowStepDto } from './dto/create-workflow-step.dto';
import { CreateWorkflowModuleDto } from './dto/create-workflow-module.dto';
import { UpdateWorkflowModuleDto } from './dto/update-workflow-module.dto';

@Injectable()
export class WorkflowRuleService {
  constructor(private prisma: PrismaService) {}

  getModules(tenantId: string) {
    return this.prisma.workflowModule.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { name: true },
    });
  }

  listModules(tenantId: string) {
    return this.prisma.workflowModule.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  createModule(tenantId: string, dto: CreateWorkflowModuleDto) {
    return this.prisma.workflowModule.create({
      data: { tenantId, ...dto },
    });
  }

  async updateModule(
    tenantId: string,
    id: string,
    dto: UpdateWorkflowModuleDto,
  ) {
    await this.findModule(tenantId, id);
    return this.prisma.workflowModule.update({ where: { id }, data: dto });
  }

  async removeModule(tenantId: string, id: string) {
    await this.findModule(tenantId, id);
    return this.prisma.workflowModule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async findModule(tenantId: string, id: string) {
    const module = await this.prisma.workflowModule.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!module) throw new NotFoundException('Workflow module not found');
    return module;
  }

  async create(tenantId: string, dto: CreateWorkflowRuleDto) {
    const existing = await this.prisma.workflowRule.findFirst({
      where: { tenantId, module: dto.module, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(
        'A workflow rule already exists for this module',
      );
    }
    const { steps, ...ruleData } = dto;
    return this.prisma.workflowRule.create({
      data: {
        tenantId,
        ...ruleData,
        ...(steps && steps.length > 0
          ? { steps: { create: steps } }
          : {}),
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
  }

  async findAll(
    tenantId: string,
    page?: string | number,
    pageSize?: string | number,
  ): Promise<Paginated<Record<string, unknown>>> {
    const { skip, take, page: p, pageSize: size } = getPagination(page, pageSize);
    const where = { tenantId, deletedAt: null };

    const [rules, total] = await Promise.all([
      this.prisma.workflowRule.findMany({
        where,
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
            include: { approverRole: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.workflowRule.count({ where }),
    ]);

    return buildPaginated(rules, total, p, size);
  }

  async findOne(tenantId: string, id: string) {
    const rule = await this.prisma.workflowRule.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: { approverRole: true, escalationRole: true },
        },
      },
    });
    if (!rule) throw new NotFoundException('Workflow rule not found');
    return rule;
  }

  async update(tenantId: string, id: string, dto: UpdateWorkflowRuleDto) {
    await this.findOne(tenantId, id);
    const { steps, ...ruleData } = dto;

    if (!steps) {
      return this.prisma.workflowRule.update({
        where: { id },
        data: ruleData,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.workflowStep.findMany({
        where: { workflowRuleId: id },
      });
      const submittedOrders = steps.map((s) => s.stepOrder);

      for (const s of steps) {
        await tx.workflowStep.upsert({
          where: {
            workflowRuleId_stepOrder: {
              workflowRuleId: id,
              stepOrder: s.stepOrder,
            },
          },
          update: {
            approverRoleId: s.approverRoleId,
            escalationRoleId: s.escalationRoleId ?? null,
            isOptional: s.isOptional ?? false,
          },
          create: {
            workflowRuleId: id,
            stepOrder: s.stepOrder,
            approverRoleId: s.approverRoleId,
            escalationRoleId: s.escalationRoleId ?? null,
            isOptional: s.isOptional ?? false,
          },
        });
      }

      for (const old of existing) {
        if (submittedOrders.includes(old.stepOrder)) continue;
        const actionCount = await tx.approvalAction.count({
          where: { workflowStepId: old.id },
        });
        if (actionCount === 0) {
          await tx.workflowStep.delete({ where: { id: old.id } });
        }
      }

      return tx.workflowRule.update({ where: { id }, data: ruleData });
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.workflowRule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addStep(tenantId: string, ruleId: string, dto: CreateWorkflowStepDto) {
    await this.findOne(tenantId, ruleId);
    const existing = await this.prisma.workflowStep.findFirst({
      where: { workflowRuleId: ruleId, stepOrder: dto.stepOrder },
    });
    if (existing) {
      throw new ConflictException('A step with this order already exists');
    }
    return this.prisma.workflowStep.create({
      data: { workflowRuleId: ruleId, ...dto },
    });
  }

  async updateStep(
    tenantId: string,
    ruleId: string,
    stepId: string,
    dto: Partial<CreateWorkflowStepDto>,
  ) {
    await this.findOne(tenantId, ruleId);
    return this.prisma.workflowStep.update({
      where: { id: stepId },
      data: dto,
    });
  }

  async removeStep(tenantId: string, ruleId: string, stepId: string) {
    await this.findOne(tenantId, ruleId);
    return this.prisma.workflowStep.delete({ where: { id: stepId } });
  }
}
