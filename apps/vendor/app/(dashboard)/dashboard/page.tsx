"use client";

import Link from "next/link";
import { Badge } from "@cj/ui";
import { Card, CardContent } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { StatCard } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";

import { useVendorDashboardKpis } from "@/features/queries";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function orderBadge(status: string) {
  if (["DELIVERED", "PAYMENT_RECEIVED", "ARTWORK_APPROVED"].includes(status))
    return "success" as const;
  if (["CANCELLED", "ARTWORK_REJECTED"].includes(status))
    return "destructive" as const;
  if (["PENDING_BRAND_APPROVAL", "PAYMENT_PENDING"].includes(status))
    return "warning" as const;
  if (status === "IN_PRODUCTION") return "violet" as const;
  return "info" as const;
}

export default function VendorDashboardPage() {
  const { kpis, orders, profile } = useVendorDashboardKpis();

  if (orders.isLoading || profile.isLoading) return <LoadingState rows={3} />;

  const recent = orders.data?.data.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${profile.data?.vendorName ?? "Vendor"}`}
      />

      {/* Hero banner */}
      <div className="from-primary to-emerald-600 relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-sm font-medium text-white/80">
            {greeting()}, {profile.data?.vendorName ?? "Vendor"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Your work at a glance
          </h2>
          <p className="mt-2 text-sm text-white/80">
            {kpis.pendingNegotiations > 0
              ? `${kpis.pendingNegotiations} negotiation${kpis.pendingNegotiations > 1 ? "s" : ""} waiting for your response`
              : "Track your orders, production and payments"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned Orders"
          value={String(kpis.assigned)}
          hint="Orders assigned to you"
          tone="green"
        />
        <StatCard
          label="In Production"
          value={String(kpis.inProduction)}
          hint="Currently being produced"
          tone="violet"
        />
        <StatCard
          label="Completed"
          value={String(kpis.completed)}
          hint="Delivered orders"
          tone="blue"
        />
        <StatCard
          label="Pending Negotiations"
          value={String(kpis.pendingNegotiations)}
          hint="Awaiting your response"
          tone="amber"
        />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Recent Assigned Orders</h2>
              <p className="text-muted-foreground text-xs">
                Latest orders in your pipeline
              </p>
            </div>
            <Link href="/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="bg-muted/50 flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
              <p className="text-muted-foreground text-sm">
                No orders assigned to you yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(order.createdAt)} · {order.siteLocation}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatINR(Number(order.totalAmount))}
                    </span>
                    <Badge variant={orderBadge(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
