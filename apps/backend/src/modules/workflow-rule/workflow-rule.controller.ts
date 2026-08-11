import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { WorkflowRuleService } from './workflow-rule.service';
import { CreateWorkflowRuleDto } from './dto/create-workflow-rule.dto';
import { UpdateWorkflowRuleDto } from './dto/update-workflow-rule.dto';
import { CreateWorkflowStepDto } from './dto/create-workflow-step.dto';
import { CreateWorkflowModuleDto } from './dto/create-workflow-module.dto';
import { UpdateWorkflowModuleDto } from './dto/update-workflow-module.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workflows')
export class WorkflowRuleController {
  constructor(private workflowRuleService: WorkflowRuleService) {}

  @RequirePermission('workflow', 'VIEW')
  @Get('modules')
  getModules(@Req() req: any) {
    return this.workflowRuleService.getModules(req.user.tenantId);
  }

  @RequirePermission('workflow', 'VIEW')
  @Get('modules/detail')
  listModules(@Req() req: any) {
    return this.workflowRuleService.listModules(req.user.tenantId);
  }

  @RequirePermission('workflow', 'CREATE')
  @Post('modules')
  createModule(@Req() req: any, @Body() dto: CreateWorkflowModuleDto) {
    return this.workflowRuleService.createModule(req.user.tenantId, dto);
  }

  @RequirePermission('workflow', 'EDIT')
  @Patch('modules/:id')
  updateModule(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowModuleDto,
  ) {
    return this.workflowRuleService.updateModule(req.user.tenantId, id, dto);
  }

  @RequirePermission('workflow', 'DELETE')
  @Delete('modules/:id')
  removeModule(@Req() req: any, @Param('id') id: string) {
    return this.workflowRuleService.removeModule(req.user.tenantId, id);
  }

  @RequirePermission('workflow', 'VIEW')
  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.workflowRuleService.findAll(
      req.user.tenantId,
      page,
      pageSize,
    );
  }

  @RequirePermission('workflow', 'VIEW')
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.workflowRuleService.findOne(req.user.tenantId, id);
  }

  @RequirePermission('workflow', 'EDIT')
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowRuleDto,
  ) {
    return this.workflowRuleService.update(req.user.tenantId, id, dto);
  }

  @RequirePermission('workflow', 'DELETE')
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.workflowRuleService.remove(req.user.tenantId, id);
  }

  @RequirePermission('workflow', 'EDIT')
  @Post(':id/steps')
  addStep(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateWorkflowStepDto,
  ) {
    return this.workflowRuleService.addStep(req.user.tenantId, id, dto);
  }

  @RequirePermission('workflow', 'EDIT')
  @Patch(':id/steps/:stepId')
  updateStep(
    @Req() req: any,
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() dto: Partial<CreateWorkflowStepDto>,
  ) {
    return this.workflowRuleService.updateStep(
      req.user.tenantId,
      id,
      stepId,
      dto,
    );
  }

  @RequirePermission('workflow', 'EDIT')
  @Delete(':id/steps/:stepId')
  removeStep(
    @Req() req: any,
    @Param('id') id: string,
    @Param('stepId') stepId: string,
  ) {
    return this.workflowRuleService.removeStep(req.user.tenantId, id, stepId);
  }
}
