"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import {
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cj/ui";
import type { OrderDto } from "@cj/types";
import { OrderStatus } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import {
  useAssignVendor,
  useOrders,
  useUpdateOrderStatus,
  useVendorsForOrders,
} from "./queries";

const STATUS_OPTIONS = Object.values(OrderStatus);

function OrderActions({ order }: { order: OrderDto }) {
  const assignVendor = useAssignVendor();
  const updateStatus = useUpdateOrderStatus();
  const { data: vendors } = useVendorsForOrders();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [vendorId, setVendorId] = React.useState("");

  async function handleAssign() {
    if (!vendorId) return;
    try {
      await assignVendor.mutateAsync({ orderId: order.id, vendorId });
      toast.success("Vendor assigned");
      setAssignOpen(false);
      setVendorId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign vendor");
    }
  }

  async function handleStatus(status: OrderStatus) {
    try {
      await updateStatus.mutateAsync({ id: order.id, status });
      toast.success(`Status → ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  const needsVendor = order.status === "PENDING_VENDOR_ASSIGNMENT" && !order.vendorId;

  return (
    <div className="flex items-center justify-end gap-2">
      {needsVendor && (
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Assign Vendor</DialogTitle>
              <DialogDescription>
                Assign a vendor to order {order.orderNumber}.
              </DialogDescription>
            </DialogHeader>
            <Select value={vendorId || undefined} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors?.data?.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.vendorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button onClick={handleAssign} disabled={!vendorId || assignVendor.isPending}>
                {assignVendor.isPending ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <Select value={order.status} onValueChange={(v) => handleStatus(v as OrderStatus)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const columns: ColumnDef<OrderDto>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.orderNumber}</p>
        <p className="text-muted-foreground text-xs">{row.original.id.slice(0, 8)}</p>
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
    accessorKey: "siteLocation",
    header: "Site",
    cell: ({ row }) => row.original.siteLocation,
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
    cell: ({ row }) => <OrderActions order={row.original} />,
  },
];

export function OrdersOverview() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useOrders(undefined, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="View and manage all orders on the platform"
      />
      {isError ? (
        <ErrorState title="Failed to load orders" description="Could not fetch orders from the server." onRetry={() => refetch()} />
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
          emptyDescription="Orders will appear here once brands place them."
        />
      )}
    </div>
  );
}
