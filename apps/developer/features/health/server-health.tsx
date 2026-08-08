"use client";

import * as React from "react";
import { Database, Server, Timer, Zap } from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
} from "@cj/ui";
import { formatDateTime } from "@cj/utils";

import { useSystemHealth } from "@/features/system/queries";

export function ServerHealth() {
  const { data, isLoading, isError, refetch } = useSystemHealth();

  if (isError) {
    return (
      <ErrorState
        title="Failed to load health"
        description="Could not fetch server health."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading || !data) return <LoadingState rows={4} />;

  const uptimeDays = Math.floor(data.uptimeSeconds / 86400);
  const uptimeHours = Math.floor((data.uptimeSeconds % 86400) / 3600);
  const uptimeMins = Math.floor((data.uptimeSeconds % 3600) / 60);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Server Health"
        description="Live connectivity and uptime status"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Database"
          value={<Badge variant={data.database === "UP" ? "default" : "destructive"}>{data.database}</Badge>}
          icon={Database}
          hint="PostgreSQL"
        />
        <StatCard
          label="Redis / Cache"
          value={<Badge variant={data.redis === "UP" ? "default" : "destructive"}>{data.redis}</Badge>}
          icon={Server}
          hint="Cache + queues"
        />
        <StatCard
          label="Uptime"
          value={`${uptimeDays}d ${uptimeHours}h ${uptimeMins}m`}
          icon={Timer}
          hint="Process uptime"
        />
        <StatCard
          label="Check Time"
          value={`${data.checkedInMs}ms`}
          icon={Zap}
          hint="Health check latency"
        />
      </div>

      <Card>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last checked at</span>
            <span>{formatDateTime(data.timestamp)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime (seconds)</span>
            <span>{data.uptimeSeconds.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Health check latency</span>
            <span>{data.checkedInMs} ms</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
