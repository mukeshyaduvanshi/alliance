"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cj/ui";
import type { NegotiationStatus, OrderDto } from "@cj/types";
import { NegotiationStatus as NegotiationStatusEnum } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import { usePermission } from "@/lib/permissions";

import {
  useOrderNegotiations,
  useOrders,
  useRespondNegotiation,
} from "./queries";

function NegotiationsDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
}: {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: negotiations, isLoading } = useOrderNegotiations(orderId);
  const respond = useRespondNegotiation();
  const canRespond = usePermission("order", "APPROVE");

  async function handleRespond(negotiationId: string, status: NegotiationStatus) {
    try {
      await respond.mutateAsync({ negotiationId, data: { status } });
      toast.success("Negotiation updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to respond");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Negotiations — {orderNumber}</DialogTitle>
          <DialogDescription>
            Respond to pending vendor negotiation proposals.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Proposed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (negotiations ?? []).length ? (
                (negotiations ?? []).map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>{n.vendor?.vendorName ?? "—"}</TableCell>
                    <TableCell>{formatINR(n.proposedAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={n.status === "PENDING" ? "outline" : n.status === "ACCEPTED" ? "default" : "destructive"}>
                        {n.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {n.status === "PENDING" && canRespond && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" onClick={() => handleRespond(n.id, NegotiationStatusEnum.ACCEPTED)}>
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRespond(n.id, NegotiationStatusEnum.REJECTED)}>
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    No negotiations
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RowActions({ order }: { order: OrderDto }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageSquare className="size-4" />
        Negotiations
      </Button>
      {open && (
        <NegotiationsDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}

const columns: ColumnDef<OrderDto>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.orderNumber}</p>
        <p className="text-muted-foreground text-xs">{row.original.siteLocation}</p>
      </div>
    ),
  },
  {
    accessorKey: "brand.brandName",
    header: "Brand",
    cell: ({ row }) => row.original.brand?.brandName ?? "—",
  },
  {
    accessorKey: "vendor.vendorName",
    header: "Vendor",
    cell: ({ row }) => row.original.vendor?.vendorName ?? "—",
  },
  {
    accessorKey: "totalAmount",
    header: "Amount",
    cell: ({ row }) => formatINR(row.original.totalAmount),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "CANCELLED" ? "destructive" : "outline"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    id: "actions",
    cell: ({ row }) => <RowActions order={row.original} />,
  },
];

export function NegotiationsOverview() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useOrders(undefined, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Negotiations"
        description="Respond to vendor negotiation proposals"
      />
      {isError ? (
        <ErrorState
          title="Failed to load orders"
          description="Could not fetch orders."
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
          emptyTitle="No orders"
          emptyDescription="Orders will appear here once brands place them."
        />
      )}
    </div>
  );
}
