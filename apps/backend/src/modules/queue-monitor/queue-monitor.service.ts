import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, type Job } from 'bullmq';
import IORedis from 'ioredis';

export const QUEUE_NAMES = [
  'notifications',
  'backups',
  'email',
  'sms',
  'sla-check',
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

type JobStatus =
  | 'waiting'
  | 'active'
  | 'delayed'
  | 'failed'
  | 'completed'
  | 'paused'
  | 'prioritized';

export interface QueueOverview {
  name: string;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
}

export interface QueueJobPayload {
  id: string;
  name: string;
  data: Record<string, unknown>;
  status: JobStatus;
  attemptsMade: number;
  failedReason?: string | null;
  timestamp: number | null;
  processedOn?: number | null;
  finishedOn?: number | null;
}

@Injectable()
export class QueueMonitorService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueMonitorService.name);
  private readonly connection: IORedis;
  private readonly queues = new Map<string, Queue>();

  constructor() {
    this.connection = new IORedis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    this.connection.on('error', (err) => {
      this.logger.warn(`Queue Redis connection error: ${err.message}`);
    });
  }

  getQueue(name: string): Queue {
    const existing = this.queues.get(name);
    if (existing) return existing;
    const queue = new Queue(name, { connection: this.connection });
    this.queues.set(name, queue);
    return queue;
  }

  async add(name: QueueName, jobName: string, data: Record<string, unknown>) {
    try {
      const queue = this.getQueue(name);
      return await queue.add(jobName, data, { attempts: 3, backoff: 2000 });
    } catch (err) {
      this.logger.error(`Failed to enqueue job on "${name}": ${(err as Error).message}`);
      return null;
    }
  }

  async getOverview(): Promise<QueueOverview[]> {
    const overview: QueueOverview[] = [];
    for (const name of QUEUE_NAMES) {
      try {
        const queue = this.getQueue(name);
        const counts = await queue.getJobCounts();
        overview.push({
          name,
          waiting: counts.waiting ?? 0,
          active: counts.active ?? 0,
          delayed: counts.delayed ?? 0,
          failed: counts.failed ?? 0,
          completed: counts.completed ?? 0,
        });
      } catch (err) {
        this.logger.error(`Failed to read queue "${name}": ${(err as Error).message}`);
        overview.push({ name, waiting: 0, active: 0, delayed: 0, failed: 0, completed: 0 });
      }
    }
    return overview;
  }

  async getJobs(
    name: string,
    status?: JobStatus,
    page = 1,
    pageSize = 20,
  ): Promise<{ data: QueueJobPayload[]; total: number }> {
    const queue = this.getQueue(name);
    const types: JobStatus[] = status
      ? [status]
      : ['waiting', 'active', 'delayed', 'failed', 'completed', 'paused', 'prioritized'];

    const [jobs, total] = await Promise.all([
      queue.getJobs(types, (page - 1) * pageSize, page * pageSize - 1, true),
      queue.getJobCounts(),
    ]);

    const totalCount = status
      ? (total[status] ?? 0)
      : Object.values(total).reduce((sum, n) => sum + n, 0);

    const payload: QueueJobPayload[] = jobs.map((job) =>
      this.toPayload(job, status),
    );

    return { data: payload, total: totalCount };
  }

  async retryJob(name: string, jobId: string) {
    const job = await this.getQueue(name).getJob(jobId);
    if (!job) throw new NotFoundException('Job not found');
    const failed = job.failedReason || (await job.isFailed());
    if (failed) {
      await job.retry();
    }
    return { retried: failed, id: jobId, name };
  }

  async removeJob(name: string, jobId: string) {
    const job = await this.getQueue(name).getJob(jobId);
    if (!job) throw new NotFoundException('Job not found');
    await job.remove();
    return { removed: true, id: jobId, name };
  }

  private toPayload(job: Job, requestedStatus?: JobStatus): QueueJobPayload {
    const status = requestedStatus ?? this.jobStatus(job);
    return {
      id: job.id ?? '',
      name: job.name,
      data: (job.data ?? {}) as Record<string, unknown>,
      status,
      attemptsMade: job.attemptsMade ?? 0,
      failedReason: job.failedReason ?? null,
      timestamp: job.timestamp ?? null,
      processedOn: job.processedOn ?? null,
      finishedOn: job.finishedOn ?? null,
    };
  }

  private jobStatus(job: Job): JobStatus {
    if (job.failedReason) return 'failed';
    if (job.finishedOn) return 'completed';
    if (job.processedOn) return 'active';
    if (job.delay) return 'delayed';
    return 'waiting';
  }

  async onModuleDestroy() {
    for (const queue of this.queues.values()) {
      try {
        await queue.close();
      } catch {
        // ignore close errors
      }
    }
    try {
      await this.connection.quit();
    } catch {
      // ignore
    }
  }
}
