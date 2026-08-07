"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@cj/ui";
import { DataTable } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import type { ColumnDef } from "@tanstack/react-table";

import { useBrandProducts } from "@/features/queries";

interface BrandProductRow {
  id: string;
  name: string;
  unit: string;
  region?: string;
  rate?: string | null;
  isCustomRate?: boolean;
  category?: { id: string; name: string } | null;
  basePrice?: string | null;
}

const columns: ColumnDef<BrandProductRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="text-muted-foreground text-xs">{row.original.unit}</p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category?.name ?? "—",
  },
  {
    accessorKey: "region",
    header: "Region",
  },
  {
    accessorKey: "rate",
    header: "Your Rate",
    cell: ({ row }) => (
      <span className="font-medium">
        ₹{row.original.rate ? Number(row.original.rate).toLocaleString("en-IN") : "—"}
      </span>
    ),
  },
  {
    accessorKey: "isCustomRate",
    header: "Type",
    cell: ({ row }) =>
      row.original.isCustomRate ? (
        <Badge variant="secondary">Custom</Badge>
      ) : (
        <Badge variant="outline">Standard</Badge>
      ),
  },
];

export default function BrandProductsPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useBrandProducts(page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Pricing"
        description="Your negotiated rate card"
      />
      {isError ? (
        <ErrorState
          title="Failed to load rate card"
          description="Could not fetch your product rates."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <DataTable
          columns={columns}
          data={(data?.data ?? []) as unknown as BrandProductRow[]}
          totalRows={data?.meta.total ?? 0}
          pageIndex={page}
          pageSize={20}
          onPageChange={setPage}
          emptyTitle="No products available"
          emptyDescription="Your rate card is empty. Contact your KAM for product setup."
        />
      )}
    </div>
  );
}
