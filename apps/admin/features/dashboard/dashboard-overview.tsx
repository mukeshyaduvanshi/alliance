"use client";

import * as React from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Package,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
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
  Button,
  Card,
  CardContent,
  PageHeader,
  Skeleton,
  StatCard,
} from "@cj/ui";
import { formatDateTime } from "@cj/utils";

import { useDashboardKpis, useOpenAlerts, useOrderStatusBreakdown } from "./queries";

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

export function DashboardOverview() {
  const { kpis, isLoading } = useDashboardKpis();
  const { data: alerts } = useOpenAlerts();
  const { data: orders } = useOrderStatusBreakdown();

  const statusData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders?.data ?? []) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({
      status,
      Orders: count,
    }));
  }, [orders]);

  const pendingApprovals = kpis.pendingBrands + kpis.pendingVendors;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform overview for Admin"
      />

      {/* Hero banner */}
      <div className="from-primary to-emerald-600 relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-24 size-40 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">
              {greeting()}, Admin
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Here's what's happening on your platform
            </h2>
            <p className="mt-2 text-sm text-white/80">
              {formatDateTime(new Date().toISOString())} ·{" "}
              {pendingApprovals > 0
                ? `${pendingApprovals} registrations awaiting approval`
                : "Everything is up to date"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              className="bg-white/15 text-white shadow-none backdrop-blur hover:bg-white/25"
            >
              <Link href="/users">
                <Users className="size-4" />
                Create User
              </Link>
            </Button>
            <Button
              asChild
              className="bg-white text-emerald-700 shadow-sm hover:bg-white/90"
            >
              <Link href="/brands/approvals">
                Approve Brands
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <StatSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={kpis.totalUsers}
            icon={Users}
            hint="Internal staff"
            tone="green"
          />
          <StatCard
            label="Total Brands"
            value={kpis.totalBrands}
            icon={Building2}
            hint={`${kpis.pendingBrands} pending approval`}
            tone="blue"
          />
          <StatCard
            label="Total Vendors"
            value={kpis.totalVendors}
            icon={Package}
            hint={`${kpis.pendingVendors} pending approval`}
            tone="amber"
          />
          <StatCard
            label="Total Orders"
            value={kpis.totalOrders}
            icon={ClipboardList}
            hint="Across all statuses"
            tone="violet"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {statusData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Orders by Status</h2>
                  <p className="text-muted-foreground text-xs">
                    Distribution across the order pipeline
                  </p>
                </div>
                <Link
                  href="/orders"
                  className="text-primary hover:underline text-xs font-medium"
                >
                  View all
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="status"
                    fontSize={10}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={12}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip cursor={{ fill: "var(--muted)" }} />
                  <Bar
                    dataKey="Orders"
                    fill="var(--primary)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Pending Approvals</h2>
              <p className="text-muted-foreground text-xs">
                Registrations waiting for review
              </p>
            </div>
            <div className="space-y-2">
              <Link
                href="/brands/approvals"
                className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 text-blue-600 flex size-9 items-center justify-center rounded-lg">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Brand registrations</p>
                    <p className="text-muted-foreground text-xs">
                      Awaiting approval
                    </p>
                  </div>
                </div>
                <Badge variant={kpis.pendingBrands > 0 ? "default" : "secondary"}>
                  {kpis.pendingBrands}
                </Badge>
              </Link>
              <Link
                href="/vendors/approvals"
                className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 text-amber-600 flex size-9 items-center justify-center rounded-lg">
                    <Package className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Vendor registrations</p>
                    <p className="text-muted-foreground text-xs">
                      Awaiting approval
                    </p>
                  </div>
                </div>
                <Badge variant={kpis.pendingVendors > 0 ? "default" : "secondary"}>
                  {kpis.pendingVendors}
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts + quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Open Alerts</h2>
                <p className="text-muted-foreground text-xs">
                  Exceptions needing attention
                </p>
              </div>
              <Badge variant={alerts?.data?.length ? "destructive" : "secondary"}>
                {alerts?.data?.length ?? 0}
              </Badge>
            </div>
            {alerts?.data && alerts.data.length > 0 ? (
              <div className="space-y-2">
                {alerts.data.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-muted-foreground truncate text-sm">
                      {alert.message}
                    </span>
                    <Badge
                      variant={
                        alert.severity === "HIGH" ? "destructive" : "outline"
                      }
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/50 flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
                <CheckCircle2 className="text-primary size-8" />
                <p className="text-muted-foreground text-sm">
                  No open alerts. All clear.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Quick Actions</h2>
              <p className="text-muted-foreground text-xs">
                Common admin tasks
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  href: "/users",
                  icon: Users,
                  label: "Manage Users",
                  tone: "text-emerald-600 bg-emerald-500/10",
                },
                {
                  href: "/roles",
                  icon: ShieldCheck,
                  label: "Roles & Permissions",
                  tone: "text-sky-600 bg-sky-500/10",
                },
                {
                  href: "/workflows/rules",
                  icon: ClipboardList,
                  label: "Workflow Rules",
                  tone: "text-violet-600 bg-violet-500/10",
                },
                {
                  href: "/monitoring/sla-rules",
                  icon: CheckCircle2,
                  label: "SLA Rules",
                  tone: "text-amber-600 bg-amber-500/10",
                },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="group flex flex-col items-start gap-3 rounded-lg border p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div
                    className={`${a.tone} flex size-9 items-center justify-center rounded-lg`}
                  >
                    <a.icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary">
                    {a.label}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
