import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueMonitorService } from '../queue-monitor/queue-monitor.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { CreateLicenseDto } from './dto/create-license.dto';
import { LogBackupDto } from './dto/log-backup.dto';

@Injectable()
export class SystemAdminService {
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private queueMonitor: QueueMonitorService,
  ) {
    this.redis = new Redis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });

    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });
  }

  // ===== System Health =====

  async getHealth() {
    const startedAt = Date.now();
    let dbStatus = 'DOWN';
    let redisStatus = 'DOWN';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'UP';
    } catch {
      dbStatus = 'DOWN';
    }

    try {
      await this.redis.ping();
      redisStatus = 'UP';
    } catch {
      redisStatus = 'DOWN';
    }

    return {
      database: dbStatus,
      redis: redisStatus,
      uptimeSeconds: process.uptime(),
      checkedInMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
  }

  // ===== Error Logs =====

  async listErrorLogs(
    tenantId: string | undefined,
    level?: string,
    limit = 50,
  ) {
    return this.prisma.errorLog.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(level ? { level: level as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ===== Cache Management =====

  async listCacheKeys(pattern = '*', limit = 100) {
    const keys = await this.redis.keys(pattern);
    return keys.slice(0, limit);
  }

  async deleteCacheKey(key: string) {
    const result = await this.redis.del(key);
    return { deleted: result > 0, key };
  }

  async flushAllCache() {
    await this.redis.flushdb();
    return { message: 'Cache cleared' };
  }

  // ===== Backup Status =====

  async logBackup(tenantId: string, dto: LogBackupDto) {
    const log = await this.prisma.backupLog.create({
      data: {
        tenantId,
        status: dto.status,
        fileSizeMb: dto.fileSizeMb,
        errorMessage: dto.errorMessage,
        startedAt: new Date(),
        completedAt: dto.status !== 'IN_PROGRESS' ? new Date() : null,
      },
    });

    // Track the backup in the queue (fire-and-forget)
    await this.queueMonitor.add('backups', 'run-backup', {
      tenantId,
      backupLogId: log.id,
      status: dto.status,
      fileSizeMb: dto.fileSizeMb,
    });

    return log;
  }

  async listBackups(tenantId: string, limit = 20) {
    return this.prisma.backupLog.findMany({
      where: { tenantId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  // ===== Subscription Plans =====

  async createPlan(dto: CreateSubscriptionPlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { name: dto.name },
    });
    if (existing)
      throw new ConflictException('Plan with this name already exists');
    return this.prisma.subscriptionPlan.create({ data: dto });
  }

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({ where: { isActive: true } });
  }

  // ===== License =====

  async createLicense(tenantId: string, dto: CreateLicenseDto) {
    const existing = await this.prisma.license.findUnique({
      where: { tenantId },
    });
    if (existing)
      throw new ConflictException('This tenant already has a license');

    return this.prisma.license.create({
      data: {
        tenantId,
        planId: dto.planId,
        startDate: new Date(dto.startDate),
        expiryDate: new Date(dto.expiryDate),
      },
    });
  }

  async getLicense(tenantId: string) {
    const license = await this.prisma.license.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
    if (!license)
      throw new NotFoundException('No license found for this tenant');

    // Auto-flag expired
    if (license.expiryDate < new Date() && license.status === 'ACTIVE') {
      return this.prisma.license.update({
        where: { tenantId },
        data: { status: 'EXPIRED' },
        include: { plan: true } as any,
      });
    }

    return license;
  }

  // ===== Email / SMS Logs (populated by Module 8 later) =====

  async listEmailLogs(tenantId: string, limit = 50) {
    return this.prisma.emailLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async listSmsLogs(tenantId: string, limit = 50) {
    return this.prisma.smsLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
