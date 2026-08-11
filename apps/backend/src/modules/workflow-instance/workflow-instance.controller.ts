import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkflowInstanceService } from './workflow-instance.service';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { ApprovalActionDto } from './dto/approval-action.dto';
import { MonitoringService } from '../monitoring/monitoring.service';

@UseGuards(JwtAuthGuard)
@Controller('workflow-instances')
export class WorkflowInstanceController {
  constructor(
    private workflowInstanceService: WorkflowInstanceService,
    private monitoringService: MonitoringService,
  ) {}

  @Post()
  start(@Req() req: any, @Body() dto: StartWorkflowDto) {
    return this.workflowInstanceService.start(
      req.user.tenantId,
      dto,
      req.user.userId,
    );
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.workflowInstanceService.findAll(
      req.user.tenantId,
      status,
      page,
      pageSize,
    );
  }

  @Get('pending')
  async getPending(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const assignedBrandIds = await this.monitoringService.getAssignedBrandIds(
      req.user.tenantId,
      req.user.userId,
    );
    return this.workflowInstanceService.getPending(
      req.user.tenantId,
      req.user.roleId,
      assignedBrandIds,
      page,
      pageSize,
    );
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.workflowInstanceService.findOne(req.user.tenantId, id);
  }

  @Post(':id/approve')
  approve(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.workflowInstanceService.approve(
      req.user.tenantId,
      id,
      req.user.userId,
      req.user.roleId,
      dto.remarks,
    );
  }

  @Post(':id/reject')
  reject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.workflowInstanceService.reject(
      req.user.tenantId,
      id,
      req.user.userId,
      req.user.roleId,
      dto.remarks,
    );
  }

  @Post(':id/escalate')
  escalate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.workflowInstanceService.escalate(
      req.user.tenantId,
      id,
      req.user.userId,
      req.user.roleId,
      dto.remarks,
    );
  }
}
