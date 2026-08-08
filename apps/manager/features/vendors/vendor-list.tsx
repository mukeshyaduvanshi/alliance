"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import {
  Badge,
  DataTable,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@cj/ui";
import type { VendorDto } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { useVendors } from "./queries";

const columns: ColumnDef<VendorDto>[] = [
  {
    accessorKey: "vendorName",
    header: "Vendor",
    cell: ({ row }) => (
      <Link href={`/vendors/${row.original.id}`}>
        <p className="font-medium hover:underline">{row.original.vendorName}</p>
        <p className="text-muted-foreground text-xs">{row.original.id.slice(0, 8)}</p>
      </Link>
    ),
  },
  {
    accessorKey: "contactPersonName",
    header: "Contact",
    cell: ({ row }) => row.original.contactPersonName ?? "—",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email ?? "—",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.original.phone ?? "—",
  },
  {
    accessorKey: "approvalStatus",
    header: "Approval",
    cell: ({ row }) => (
      <Badge variant={row.original.approvalStatus === "APPROVED" ? "default" : "outline"}>
        {row.original.approvalStatus}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
];

export function VendorList() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useVendors(page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Manage and monitor vendors"
      />
      {isError ? (
        <ErrorState
          title="Failed to load vendors"
          description="Could not fetch vendors."
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
          emptyTitle="No vendors found"
          emptyDescription="Vendors will appear here once they register."
        />
      )}
    </div>
  );
}
