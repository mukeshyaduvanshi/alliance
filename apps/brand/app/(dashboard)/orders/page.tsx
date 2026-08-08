"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@cj/ui";
import { DataTable } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { formatDateTime } from "@cj/utils";
import type { OrderDto } from "@cj/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useBrandOrders } from "@/features/queries";
import { orderBadge } from "@/lib/status";

const statusTabs: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PLACED", label: "Placed" },
  { value: "PENDING_BRAND_APPROVAL", label: "Artwork Approval" },
  { value: "IN_PRODUCTION", label: "In Production" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const columns: ColumnDef<OrderDto, unknown>[] = [
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={orderBadge(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: "Amount",
    cell: ({ row }) =>
      `₹${Number(row.original.totalAmount).toLocaleString("en-IN")}`,
  },
  {
    accessorKey: "siteLocation",
    header: "Site",
  },
  {
    accessorKey: "createdAt",
    header: "Placed On",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
];

export default function BrandOrdersPage() {
  const [status, setStatus] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useBrandOrders(
    status === "ALL" ? undefined : status,
    page
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Orders"
        description="Track and manage your orders"
        actions={
          <Link
            href="/orders/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Place Order
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`rounded-md px-3 py-1.5 text-sm ${
              status === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState
          title="Failed to load orders"
          description="Could not fetch your orders."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          totalRows={data?.meta.total ?? 0}
          pageIndex={page}
          pageSize={20}
          onPageChange={setPage}
          emptyTitle="No orders found"
          emptyDescription="Place your first order to get started."
        />
      )}
    </div>
  );
}
