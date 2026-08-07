"use client";

import * as React from "react";
import { Badge } from "@cj/ui";
import { DataTable } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";
import type { PurchaseOrderDto } from "@cj/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useBrandPurchaseOrders } from "@/features/queries";

const columns: ColumnDef<PurchaseOrderDto, unknown>[] = [
  {
    accessorKey: "poNumber",
    header: "PO Number",
  },
  {
    accessorKey: "totalBudget",
    header: "Budget",
    cell: ({ row }) => formatINR(Number(row.original.totalBudget)),
  },
  {
    accessorKey: "consumedAmount",
    header: "Consumed",
    cell: ({ row }) => formatINR(Number(row.original.consumedAmount)),
  },
  {
    id: "remaining",
    header: "Remaining",
    cell: ({ row }) => {
      const remaining =
        Number(row.original.totalBudget) - Number(row.original.consumedAmount);
      return formatINR(remaining);
    },
  },
  {
    id: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const total = Number(row.original.totalBudget);
      const consumed = Number(row.original.consumedAmount);
      const pct = total > 0 ? Math.min(100, Math.round((consumed / total) * 100)) : 0;
      return (
        <div className="w-28">
          <div className="h-2 rounded-full bg-muted">
            <div
              className={`h-2 rounded-full ${pct >= 90 ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{pct}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) =>
      row.original.isActive ? (
        <Badge variant="secondary">Active</Badge>
      ) : (
        <Badge variant="outline">Inactive</Badge>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
];

export default function BrandPurchaseOrdersPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useBrandPurchaseOrders(page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Your budget and consumption across purchase orders"
      />
      {isError ? (
        <ErrorState
          title="Failed to load POs"
          description="Could not fetch your purchase orders."
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
          emptyTitle="No purchase orders found"
          emptyDescription="Purchase orders created by the admin will appear here."
        />
      )}
    </div>
  );
}
