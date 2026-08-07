"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@cj/ui";
import { DataTable } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";
import type { VendorOrderDto } from "@cj/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useVendorOrders } from "@/features/queries";

const statusTabs: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "VENDOR_ASSIGNED", label: "Assigned" },
  { value: "IN_PRODUCTION", label: "In Production" },
  { value: "INSTALLATION_COMPLETE", label: "Installed" },
  { value: "PAYMENT_PENDING", label: "Payment Pending" },
  { value: "PAYMENT_RECEIVED", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
];

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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
  },
  {
    accessorKey: "totalAmount",
    header: "Order Amount",
    cell: ({ row }) => formatINR(Number(row.original.totalAmount)),
  },
  {
    accessorKey: "vendorTotalAmount",
    header: "Your Amount",
    cell: ({ row }) =>
      row.original.vendorTotalAmount
        ? formatINR(Number(row.original.vendorTotalAmount))
        : "—",
  },
  {
    accessorKey: "siteLocation",
    header: "Site",
  },
  {
    accessorKey: "createdAt",
    header: "Assigned On",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
];

export default function VendorOrdersPage() {
  const [status, setStatus] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useVendorOrders(
    status === "ALL" ? undefined : status,
    page
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Orders"
        description="Orders assigned to you"
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
          emptyDescription="Orders assigned to you will appear here."
        />
      )}
    </div>
  );
}
