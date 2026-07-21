import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowRuleDto } from './dto/create-workflow-rule.dto';
import { UpdateWorkflowRuleDto } from './dto/update-workflow-rule.dto';
import { CreateWorkflowStepDto } from './dto/create-workflow-step.dto';

@Injectable()
export class WorkflowRuleService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateWorkflowRuleDto) {
    const existing = await this.prisma.workflowRule.findFirst({
      where: { tenantId, module: dto.module, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(
        'A workflow rule already exists for this module',
      );
    }
    return this.prisma.workflowRule.create({
      data: { tenantId, ...dto },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.workflowRule.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: { approverRole: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
    return this.prisma.workflowRule.update({ where: { id }, data: dto });
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
