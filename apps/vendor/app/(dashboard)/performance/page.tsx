"use client";

import { Card, CardContent } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { formatINR } from "@cj/utils";

import { useVendorOrders } from "@/features/queries";

export default function VendorPerformancePage() {
  const { data, isLoading } = useVendorOrders(undefined, 1);
  const all = data?.data ?? [];

  if (isLoading) return <LoadingState rows={3} />;

  const completed = all.filter((o) =>
    ["INSTALLATION_COMPLETE", "PAYMENT_PENDING", "PAYMENT_RECEIVED"].includes(o.status)
  );
  const cancelled = all.filter((o) => o.status === "CANCELLED");
  const earnings = completed.reduce((s, o) => s + Number(o.vendorTotalAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance"
        description="Your order performance summary"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completed Orders</p>
            <p className="text-2xl font-semibold">{completed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Earnings</p>
            <p className="text-2xl font-semibold">{formatINR(earnings)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cancelled Orders</p>
            <p className="text-2xl font-semibold">{cancelled.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Ratings and performance reports are part of a future release.
        </CardContent>
      </Card>
    </div>
  );
}
