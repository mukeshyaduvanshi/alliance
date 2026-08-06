"use client";

import { Building2, CheckCircle2, Package, Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@cj/ui";
import { Card, CardContent } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { StatCard } from "@cj/ui";
import { Skeleton } from "@cj/ui";

import { useDashboardKpis, useOpenAlerts } from "./queries";

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

export function DashboardOverview() {
  const { kpis, isLoading } = useDashboardKpis();
  const { data: alerts } = useOpenAlerts();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform overview for Super Admin"
      />

      {isLoading ? (
        <StatSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={kpis.totalUsers}
            icon={Users}
            hint="Internal staff"
          />
          <StatCard
            label="Total Brands"
            value={kpis.totalBrands}
            icon={Building2}
            hint={`${kpis.pendingBrands} pending approval`}
          />
          <StatCard
            label="Total Vendors"
            value={kpis.totalVendors}
            icon={Package}
            hint={`${kpis.pendingVendors} pending approval`}
          />
          <StatCard
            label="Total Orders"
            value={kpis.totalOrders}
            icon={CheckCircle2}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Pending Approvals</h2>
              <Badge variant="secondary">
                {kpis.pendingBrands + kpis.pendingVendors}
              </Badge>
            </div>
            <div className="space-y-2">
              <Link
                href="/brands/approvals"
                className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
              >
                <span className="text-sm">Brand registrations</span>
                <Badge variant="outline">{kpis.pendingBrands}</Badge>
              </Link>
              <Link
                href="/vendors/approvals"
                className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
              >
                <span className="text-sm">Vendor registrations</span>
                <Badge variant="outline">{kpis.pendingVendors}</Badge>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Open Alerts</h2>
              <Badge variant="secondary">{alerts?.data?.length ?? 0}</Badge>
            </div>
            {alerts?.data && alerts.data.length > 0 ? (
              <div className="space-y-2">
                {alerts.data.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <span className="text-sm">{alert.message}</span>
                    <Badge variant="outline">{alert.severity}</Badge>
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
    </div>
  );
}
