"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@cj/ui";
import { Card, CardContent } from "@cj/ui";
import { DataTable } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";
import type { VendorOrderDto } from "@cj/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useVendorOrders } from "@/features/queries";

const columns: ColumnDef<VendorOrderDto, unknown>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <Link
        href={`/orders/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.orderNumber}
      </Link>
    ),
  },
  {
    accessorKey: "vendorTotalAmount",
    header: "Amount",
    cell: ({ row }) =>
      row.original.vendorTotalAmount
        ? formatINR(Number(row.original.vendorTotalAmount))
        : "—",
  },
  {
    accessorKey: "status",
    header: "Payment Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const label =
        status === "PAYMENT_RECEIVED"
          ? "PAID"
          : status === "PAYMENT_PENDING"
            ? "PENDING"
            : "NOT DUE";
      const variant =
        status === "PAYMENT_RECEIVED"
          ? "secondary"
          : status === "PAYMENT_PENDING"
            ? "destructive"
            : "outline";
      return <Badge variant={variant as "secondary" | "destructive" | "outline"}>{label}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
];

export default function VendorPaymentsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useVendorOrders(undefined, page);

  const all = data?.data ?? [];
  const paid = all.filter((o) => o.status === "PAYMENT_RECEIVED");
  const pending = all.filter((o) => o.status === "PAYMENT_PENDING");
  const totalPaid = paid.reduce((s, o) => s + Number(o.vendorTotalAmount ?? 0), 0);
  const totalPending = pending.reduce((s, o) => s + Number(o.vendorTotalAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Payment status across your orders"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Received</p>
            <p className="text-2xl font-semibold">{formatINR(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-semibold">{formatINR(totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      {isError ? (
        <ErrorState
          title="Failed to load payments"
          description="Could not fetch payment data."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <DataTable
          columns={columns}
          data={all}
          totalRows={data?.meta.total ?? 0}
          pageIndex={page}
          pageSize={20}
          onPageChange={setPage}
          emptyTitle="No orders yet"
          emptyDescription="Payment details will appear here once you have orders."
        />
      )}
    </div>
  );
}
