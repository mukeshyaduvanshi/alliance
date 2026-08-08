"use client";

import * as React from "react";
import Link from "next/link";
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
  Tabs,
  TabsList,
  TabsTrigger,
} from "@cj/ui";
import type { OrderDto, OrderStatus } from "@cj/types";
import { OrderStatus as OrderStatusEnum } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import { usePermission } from "@/lib/permissions";

import {
  useAssignVendor,
  useOrders,
  useUpdateOrderStatus,
  useVendorsForOrders,
} from "./queries";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PLACED", label: "Placed" },
  { value: "PENDING_VENDOR_ASSIGNMENT", label: "Vendor Pending" },
  { value: "VENDOR_ASSIGNED", label: "Vendor Assigned" },
  { value: "IN_PRODUCTION", label: "In Production" },
  { value: "INSTALLATION_COMPLETE", label: "Installed" },
  { value: "PAYMENT_PENDING", label: "Payment Pending" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_OPTIONS = Object.values(OrderStatusEnum);

function OrderActions({ order }: { order: OrderDto }) {
  const canAssign = usePermission("vendor_assignment", "EDIT");
  const canUpdate = usePermission("order", "EDIT");
  const assignVendor = useAssignVendor();
  const updateStatus = useUpdateOrderStatus();
  const { data: vendors } = useVendorsForOrders();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [vendorId, setVendorId] = React.useState("");

  if (!canAssign && !canUpdate) return null;

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
      {canAssign && needsVendor && (
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
              <Button
                onClick={handleAssign}
                disabled={!vendorId || assignVendor.isPending}
              >
                {assignVendor.isPending ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {canUpdate && (
        <Select
          value={order.status}
          onValueChange={(v) => handleStatus(v as OrderStatus)}
        >
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
      )}
    </div>
  );
}

const columns: ColumnDef<OrderDto>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <Link href={`/orders/${row.original.id}`}>
        <p className="font-medium hover:underline">{row.original.orderNumber}</p>
        <p className="text-muted-foreground text-xs">
          {row.original.id.slice(0, 8)}
        </p>
      </Link>
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
  const [status, setStatus] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useOrders(
    status === "ALL" ? undefined : { status },
    page
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track and manage all orders"
      />
      <Tabs
        value={status}
        onValueChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      >
        <TabsList className="flex-wrap">
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {isError ? (
        <ErrorState
          title="Failed to load orders"
          description="Could not fetch orders from the server."
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
          emptyDescription="Orders will appear here once brands place them."
        />
      )}
    </div>
  );
}
