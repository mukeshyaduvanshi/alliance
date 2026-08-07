"use client";

import * as React from "react";
import { Badge } from "@cj/ui";
import { DataTable } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";
import type { InvoiceDto } from "@cj/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";

import { useBrandInvoices } from "@/features/queries";

const columns: ColumnDef<InvoiceDto, unknown>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "Invoice",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatINR(Number(row.original.amount)),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
  },
  {
    accessorKey: "po",
    header: "PO",
    cell: ({ row }) => row.original.po?.poNumber ?? "—",
  },
  {
    accessorKey: "createdAt",
    header: "Issued",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    id: "file",
    header: "",
    cell: ({ row }) =>
      row.original.fileUrl ? (
        <a
          href={row.original.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Download className="size-3.5" /> Download
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">No file</span>
      ),
  },
];

export default function BrandInvoicesPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useBrandInvoices(page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & Documents"
        description="Download your invoices and documents"
      />
      {isError ? (
        <ErrorState
          title="Failed to load invoices"
          description="Could not fetch your invoices."
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
          emptyTitle="No invoices yet"
          emptyDescription="Invoices will appear here once generated."
        />
      )}
    </div>
  );
}
