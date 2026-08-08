"use client";

import { Card, CardContent } from "@cj/ui";
import { Badge } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { StatCard } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";
import Link from "next/link";

import { useDashboardKpis } from "@/features/queries";
import { orderBadge } from "@/lib/status";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function BrandDashboardPage() {
  const { kpis, orders, pos, profile } = useDashboardKpis();

  const isLoading = orders.isLoading || pos.isLoading || profile.isLoading;
  const budgetPercent =
    kpis.totalPoBudget > 0
      ? Math.round((kpis.totalPoConsumed / kpis.totalPoBudget) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${profile.data?.brandName ?? "Brand"}`}
      />

      {/* Hero banner */}
      <div className="from-primary to-emerald-600 relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-sm font-medium text-white/80">
            {greeting()}, {profile.data?.brandName ?? "Brand"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Your business at a glance
          </h2>
          <p className="mt-2 text-sm text-white/80">
            {kpis.pendingArtwork > 0
              ? `${kpis.pendingArtwork} artwork${kpis.pendingArtwork > 1 ? "s" : ""} awaiting your approval`
              : "Track your orders, budget and approvals here"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState rows={3} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Orders"
              value={String(kpis.totalOrders)}
              tone="green"
            />
            <StatCard
              label="PO Budget Consumed"
              value={`${budgetPercent}%`}
              hint={
                kpis.totalPoBudget > 0
                  ? `${formatINR(String(kpis.totalPoConsumed))} of ${formatINR(String(kpis.totalPoBudget))}`
                  : "No open POs"
              }
              tone="blue"
            />
            <StatCard
              label="Pending Artwork Approvals"
              value={String(kpis.pendingArtwork)}
              hint="Awaiting your review"
              tone="amber"
            />
            <StatCard
              label="Assigned KAM"
              value={
                (profile.data?.assignedKam as { fullName?: string } | undefined)
                  ?.fullName ?? "—"
              }
              hint="Your relationship manager"
              tone="violet"
            />
          </div>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Recent Orders</h2>
                  <p className="text-muted-foreground text-xs">
                    Latest order activity
                  </p>
                </div>
                <Link href="/orders">
                  <Badge variant="outline">View all</Badge>
                </Link>
              </div>
              {orders.data?.data.length === 0 ? (
                <div className="bg-muted/50 flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    No orders yet. Place your first order to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.data?.data.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {formatINR(order.totalAmount)}
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
        </>
      )}
    </div>
  );
}
