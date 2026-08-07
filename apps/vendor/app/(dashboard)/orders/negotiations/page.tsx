"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@cj/ui";
import { Card, CardContent } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";
import { NegotiationStatus } from "@cj/types";

import { useVendorOrders } from "@/features/queries";

export default function VendorNegotiationsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useVendorOrders(undefined, page);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load negotiations"
        description="Could not fetch negotiation history."
        onRetry={() => refetch()}
      />
    );
  }
  if (isLoading) return <LoadingState rows={4} />;

  const negotiations = (data?.data ?? [])
    .flatMap((order) =>
      (order.negotiations ?? []).map((n) => ({
        ...n,
        orderNumber: order.orderNumber,
        orderId: order.id,
      }))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Negotiations"
        description="Your proposed amount revisions"
      />
      {negotiations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No negotiations yet. Propose an amount revision from an assigned order.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {negotiations.map((n) => (
            <Card key={n.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <Link
                    href={`/orders/${n.orderId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {n.orderNumber}
                  </Link>
                  <p className="text-sm">
                    Proposed: {formatINR(Number(n.proposedAmount))}
                  </p>
                  {n.remarks && (
                    <p className="text-muted-foreground text-xs">{n.remarks}</p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {formatDateTime(n.createdAt)}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <Badge
                    variant={
                      n.status === NegotiationStatus.ACCEPTED
                        ? "secondary"
                        : n.status === NegotiationStatus.REJECTED
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {n.status}
                  </Badge>
                  {n.responseRemarks && (
                    <p className="text-muted-foreground text-xs">
                      {n.responseRemarks}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
