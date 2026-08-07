"use client";

import Link from "next/link";
import { Badge } from "@cj/ui";
import { Card, CardContent } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { StatCard } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";

import { useVendorDashboardKpis } from "@/features/queries";

export default function VendorDashboardPage() {
  const { kpis, orders, profile } = useVendorDashboardKpis();

  if (orders.isLoading || profile.isLoading) return <LoadingState rows={3} />;

  const recent = orders.data?.data.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome, {profile.data?.vendorName ?? "Vendor"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Orders" value={String(kpis.assigned)} />
        <StatCard label="In Production" value={String(kpis.inProduction)} />
        <StatCard label="Completed" value={String(kpis.completed)} />
        <StatCard
          label="Pending Negotiations"
          value={String(kpis.pendingNegotiations)}
        />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Recent Assigned Orders</h2>
            <Link href="/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No orders assigned to you yet.
            </p>
          ) : (
            <div className="divide-y">
              {recent.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(order.createdAt)} · {order.siteLocation}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">
                      {formatINR(Number(order.totalAmount))}
                    </span>
                    <Badge variant="secondary">{order.status}</Badge>
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
