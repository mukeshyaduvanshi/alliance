"use client";

import * as React from "react";
import { Badge } from "@cj/ui";
import { Card, CardContent } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";
import { toast } from "sonner";

import { useBrandOrders, useBrandPurchaseOrders } from "@/features/queries";

export default function BrandReportsPage() {
  const [page, setPage] = React.useState(1);
  const orders = useBrandOrders(undefined, page);
  const pos = useBrandPurchaseOrders(1);

  if (orders.isLoading || pos.isLoading) return <LoadingState rows={4} />;
  if (orders.isError) {
    return (
      <ErrorState
        title="Failed to load reports"
        description="Could not fetch report data."
        onRetry={() => orders.refetch()}
      />
    );
  }

  const orderList = orders.data?.data ?? [];
  const totalSpend = orderList
    .filter((o) => o.status !== "CANCELLED")
    .reduce((s, o) => s + Number(o.totalAmount), 0);
  const totalBudget =
    pos.data?.data.reduce((s, p) => s + Number(p.totalBudget), 0) ?? 0;
  const avgOrder = orderList.length
    ? Math.round(totalSpend / orderList.filter((o) => o.status !== "CANCELLED").length || 0)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Order history and spend analytics"
        actions={
          <button
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              const rows = orderList.map((o) =>
                [o.orderNumber, o.status, o.totalAmount, o.createdAt].join(",")
              );
              const csv =
                "Order,Status,Amount,Created\n" + rows.join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "orders.csv";
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Report exported");
            }}
          >
            Export CSV
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Spend</p>
            <p className="text-2xl font-semibold">{formatINR(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total PO Budget</p>
            <p className="text-2xl font-semibold">{formatINR(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Order Value</p>
            <p className="text-2xl font-semibold">{formatINR(avgOrder)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="spend">Spend Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="space-y-2">
          {orderList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            orderList.map((o) => (
              <Card key={o.id}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="text-sm font-medium">{o.orderNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">
                      {formatINR(Number(o.totalAmount))}
                    </span>
                    <Badge variant="secondary">{o.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              className="rounded-md bg-muted px-3 py-1.5 text-sm disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="rounded-md bg-muted px-3 py-1.5 text-sm disabled:opacity-50"
              disabled={!orders.data?.meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </TabsContent>
        <TabsContent value="spend">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  PO Budget Consumed (page view)
                </span>
                <span className="text-sm font-medium">
                  {formatINR(
                    pos.data?.data.reduce(
                      (s, p) => s + Number(p.consumedAmount),
                      0
                    ) ?? 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Orders</span>
                <span className="text-sm font-medium">
                  {orders.data?.meta.total ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
