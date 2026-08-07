"use client";

import { Card, CardContent } from "@cj/ui";
import { Badge } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { StatCard } from "@cj/ui";
import { formatDateTime } from "@cj/utils";

import { useDashboardKpis } from "@/features/queries";

export default function BrandDashboardPage() {
  const { kpis, orders, pos, profile } = useDashboardKpis();

  const isLoading =
    orders.isLoading || pos.isLoading || profile.isLoading;
  const budgetPercent =
    kpis.totalPoBudget > 0
      ? Math.round((kpis.totalPoConsumed / kpis.totalPoBudget) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome, {profile.data?.brandName ?? "Brand"}
        </p>
      </div>

      {isLoading ? (
        <LoadingState rows={3} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Orders" value={String(kpis.totalOrders)} />
            <StatCard
              label="PO Budget Consumed"
              value={`${budgetPercent}%`}
              hint={
                kpis.totalPoBudget > 0
                  ? `₹${kpis.totalPoConsumed.toLocaleString("en-IN")} of ₹${kpis.totalPoBudget.toLocaleString("en-IN")}`
                  : "No open POs"
              }
            />
            <StatCard
              label="Pending Artwork Approvals"
              value={String(kpis.pendingArtwork)}
            />
            <StatCard
              label="Assigned KAM"
              value={
                (profile.data?.assignedKam as { fullName?: string } | undefined)
                  ?.fullName ?? "—"
              }
            />
          </div>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-sm font-medium">Recent Orders</h2>
              {orders.data?.data.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No orders yet. Place your first order to get started.
                </p>
              ) : (
                <div className="divide-y">
                  {orders.data?.data.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">
                          ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                        </span>
                        <Badge variant="secondary">{order.status}</Badge>
                      </div>
                    </div>
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
