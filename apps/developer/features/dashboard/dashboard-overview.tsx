"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, Database, Server, Timer } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
} from "@cj/ui";
import { formatDateTime } from "@cj/utils";

import {
  useBackups,
  useCacheKeys,
  useErrorLogs,
  useQueues,
  useSystemHealth,
} from "@/features/system/queries";

function StatSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="gap-2 py-4">
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "UP" ? "default" : "destructive"}>{status}</Badge>
  );
}

export function DashboardOverview() {
  const { data: health, isLoading, isError, refetch } = useSystemHealth();
  const { data: errors } = useErrorLogs();
  const { data: backups } = useBackups();
  const { data: queues } = useQueues();
  const { data: cacheKeys } = useCacheKeys();

  const failedJobs =
    queues?.reduce((sum, q) => sum + (q.failed ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Dashboard"
        description="Server health and operational overview"
      />

      {isLoading || isError ? (
        <StatSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Database"
            value={<StatusBadge status={health?.database ?? "DOWN"} />}
            icon={Database}
            hint="PostgreSQL connectivity"
          />
          <StatCard
            label="Redis / Cache"
            value={<StatusBadge status={health?.redis ?? "DOWN"} />}
            icon={Server}
            hint="Cache + queues backend"
          />
          <StatCard
            label="Uptime"
            value={`${Math.round((health?.uptimeSeconds ?? 0) / 3600)}h`}
            icon={Timer}
            hint="Process uptime"
          />
          <StatCard
            label="Failed Jobs"
            value={failedJobs}
            icon={Activity}
            hint="Across all queues"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Queue Depth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={(queues ?? []).map((q) => ({
                  name: q.name,
                  Waiting: q.waiting,
                  Active: q.active,
                  Failed: q.failed,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Waiting" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Active" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Failed" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Errors by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={(() => {
                  const counts: Record<string, number> = {};
                  for (const e of errors ?? []) {
                    counts[e.level] = (counts[e.level] ?? 0) + 1;
                  }
                  return Object.entries(counts).map(([level, count]) => ({
                    level,
                    Errors: count,
                  }));
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Errors" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Recent Errors</h2>
              <Link href="/error-logs">
                <Badge variant="secondary">{errors?.length ?? 0}</Badge>
              </Link>
            </div>
            {isError ? (
              <ErrorState title="Failed to load errors" description="Could not fetch error logs." onRetry={() => refetch()} />
            ) : errors && errors.length > 0 ? (
              <div className="space-y-2">
                {errors.slice(0, 5).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.message}</p>
                      <p className="text-muted-foreground text-xs">
                        {e.path ?? "—"} · {formatDateTime(e.createdAt)}
                      </p>
                    </div>
                    <Badge variant={e.level === "CRITICAL" ? "destructive" : "outline"}>
                      {e.level}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No errors recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Queues</h2>
              <Link href="/queues">
                <Badge variant="secondary">View all</Badge>
              </Link>
            </div>
            {queues && queues.length > 0 ? (
              <div className="space-y-2">
                {queues.map((q) => (
                  <div
                    key={q.name}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <span className="text-sm font-medium capitalize">{q.name}</span>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">{q.waiting} waiting</Badge>
                      <Badge variant={q.failed > 0 ? "destructive" : "outline"}>
                        {q.failed} failed
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No queues available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Recent Backups</h2>
              <Link href="/backups">
                <Badge variant="secondary">{backups?.length ?? 0}</Badge>
              </Link>
            </div>
            {backups && backups.length > 0 ? (
              <div className="space-y-2">
                {backups.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <span className="text-sm">{formatDateTime(b.startedAt)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {b.fileSizeMb != null ? `${b.fileSizeMb} MB` : "—"}
                      </span>
                      <Badge variant={b.status === "SUCCESS" ? "default" : b.status === "FAILED" ? "destructive" : "outline"}>
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No backups yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Cache</h2>
              <Link href="/cache">
                <Badge variant="secondary">{cacheKeys?.length ?? 0} keys</Badge>
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              {cacheKeys && cacheKeys.length > 0
                ? `${cacheKeys.length} cache keys currently stored.`
                : "No cache keys found."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
