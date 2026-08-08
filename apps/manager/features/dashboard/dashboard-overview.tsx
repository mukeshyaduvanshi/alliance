"use client";

import * as React from "react";
import { Building2, CheckCircle2, Package, ShieldAlert } from "lucide-react";
import { ArrowUp, Check, X } from "lucide-react";
import Link from "next/link";

import {
  Badge,
  Button,
  Card,
  CardContent,
  LoadingState,
  PageHeader,
  Skeleton,
  StatCard,
} from "@cj/ui";
import { formatINR } from "@cj/utils";
import type { WorkflowInstanceDto } from "@cj/types";

import { usePermission } from "@/lib/permissions";

import { useKamDashboard, useOpenAlerts } from "./queries";
import { usePendingWorkflows } from "@/features/approvals/queries";
import { DecisionDialog, type Decision } from "@/features/approvals/approval-dialog";

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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function PendingApprovalRow({ instance }: { instance: WorkflowInstanceDto }) {
  const canApprove = usePermission("workflow", "APPROVE");
  const canReject = usePermission("workflow", "REJECT");
  const canEscalate = usePermission("workflow", "EDIT");
  const [decision, setDecision] = React.useState<Decision | null>(null);

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {instance.workflowRule?.name ?? instance.entityType}
        </p>
        <p className="text-muted-foreground text-xs">
          {instance.entityType} · {instance.entityId.slice(0, 8)} · Step{" "}
          {instance.currentStepOrder}
        </p>
      </div>
      {(canApprove || canReject || canEscalate) && (
        <div className="flex shrink-0 gap-1">
          {canApprove && (
            <Button variant="ghost" size="icon-sm" title="Approve" onClick={() => setDecision("APPROVE")}>
              <Check className="size-4 text-emerald-500" />
            </Button>
          )}
          {canReject && (
            <Button variant="ghost" size="icon-sm" title="Reject" onClick={() => setDecision("REJECT")}>
              <X className="size-4 text-red-500" />
            </Button>
          )}
          {canEscalate && (
            <Button variant="ghost" size="icon-sm" title="Escalate" onClick={() => setDecision("ESCALATE")}>
              <ArrowUp className="size-4 text-amber-500" />
            </Button>
          )}
        </div>
      )}
      {decision && (
        <DecisionDialog
          instance={instance}
          decision={decision}
          open={true}
          onOpenChange={(open) => !open && setDecision(null)}
        />
      )}
    </div>
  );
}

export function DashboardOverview() {
  const { data: kam, isLoading, isError } = useKamDashboard();
  const { data: pending } = usePendingWorkflows(1);
  const { data: alerts } = useOpenAlerts();

  const pendingApprovals = pending?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="KAM / Manager operations overview"
      />

      {/* Hero banner */}
      <div className="from-primary to-emerald-600 relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-sm font-medium text-white/80">{greeting()}, KAM</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Your portfolio at a glance
          </h2>
          <p className="mt-2 text-sm text-white/80">
            {pendingApprovals.length > 0
              ? `${pendingApprovals.length} approval${pendingApprovals.length > 1 ? "s" : ""} awaiting your decision`
              : "You're all caught up on approvals"}
          </p>
        </div>
      </div>

      {isLoading || isError ? (
        <StatSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Assigned Brands"
            value={kam?.totalBrands ?? 0}
            icon={Building2}
            hint="Brands assigned to you"
            tone="blue"
          />
          <StatCard
            label="Active Orders"
            value={kam?.pendingOrders ?? 0}
            icon={Package}
            hint="In-progress orders"
            tone="green"
          />
          <StatCard
            label="Pending Approvals"
            value={pending?.meta.total ?? 0}
            icon={CheckCircle2}
            hint="Awaiting your decision"
            tone="amber"
          />
          <StatCard
            label="Open Alerts"
            value={alerts?.data?.length ?? kam?.activeAlerts ?? 0}
            icon={ShieldAlert}
            hint="Unresolved exceptions"
            tone="rose"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Pending Approvals</h2>
                <p className="text-muted-foreground text-xs">Awaiting your decision</p>
              </div>
              <Link href="/approvals">
                <Badge variant="warning">{pendingApprovals.length}</Badge>
              </Link>
            </div>
            {pendingApprovals.length > 0 ? (
              <div className="space-y-2">
                {pendingApprovals.slice(0, 5).map((instance) => (
                  <PendingApprovalRow key={instance.id} instance={instance} />
                ))}
              </div>
            ) : (
              <div className="bg-muted/50 flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
                <CheckCircle2 className="text-primary size-8" />
                <p className="text-muted-foreground text-sm">
                  No pending approvals. All caught up.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Open Alerts</h2>
                <p className="text-muted-foreground text-xs">Unresolved exceptions</p>
              </div>
              <Link href="/sla/alerts">
                <Badge variant={alerts?.data?.length ? "destructive" : "secondary"}>
                  {alerts?.data?.length ?? 0}
                </Badge>
              </Link>
            </div>
            {alerts?.data && alerts.data.length > 0 ? (
              <div className="space-y-2">
                {alerts.data.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="truncate text-sm">{alert.message}</span>
                    <Badge variant={alert.severity === "HIGH" ? "destructive" : "outline"}>
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No open alerts. All clear.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Recent Orders</h2>
              <p className="text-muted-foreground text-xs">Latest activity across your brands</p>
            </div>
            <Link href="/orders">
              <Badge variant="outline">View all</Badge>
            </Link>
          </div>
          {isLoading ? (
            <LoadingState rows={4} />
          ) : kam?.recentOrders?.length ? (
            <div className="space-y-2">
              {kam.recentOrders.slice(0, 8).map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {order.orderNumber}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {order.brand?.brandName ?? "—"} · {order.siteLocation}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatINR(order.totalAmount)}
                    </span>
                    <Badge variant="info">{order.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No recent orders.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
