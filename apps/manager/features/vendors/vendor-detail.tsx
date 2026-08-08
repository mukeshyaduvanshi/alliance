"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
} from "@cj/ui";
import type { OrderDto, OrderStatus } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";
import { Package, ShoppingCart, Wallet } from "lucide-react";

import { useVendor, useVendorOrders } from "./queries";

const orderColumns: ColumnDef<OrderDto>[] = [
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
];

function PerformanceSummary({ orders, total }: { orders: OrderDto[]; total: number }) {
  const totals: Record<OrderStatus, number> = {} as Record<OrderStatus, number>;
  const totalValue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  for (const o of orders) {
    totals[o.status] = (totals[o.status] ?? 0) + 1;
  }

  const statuses = Object.entries(totals) as [OrderStatus, number][];
  const partial = total > orders.length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Orders"
          value={total}
          icon={ShoppingCart}
          hint={partial ? "across all pages" : "in this vendor"}
        />
        <StatCard
          label="Order Value"
          value={formatINR(String(totalValue))}
          icon={Wallet}
          hint={partial ? `based on ${orders.length} recent orders` : "total value"}
        />
        <StatCard
          label="Active Statuses"
          value={statuses.length}
          icon={Package}
          hint="distinct order states"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {statuses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {statuses.map(([status, count]) => (
                <Badge key={status} variant="outline" className="gap-1">
                  {status}
                  <span className="font-semibold">{count}</span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function VendorDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [page, setPage] = React.useState(1);

  const { data: vendor, isLoading, isError, refetch } = useVendor(id);
  const {
    data: orders,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useVendorOrders(id, page);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load vendor"
        description="Could not fetch vendor details."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading || !vendor) return <LoadingState rows={4} />;

  const profile = vendor.businessProfile;

  return (
    <div className="space-y-6">
      <PageHeader
        title={vendor.vendorName}
        description={`${vendor.id.slice(0, 8)} · ${vendor.email ?? "—"}`}
        actions={
          <Badge variant={vendor.approvalStatus === "APPROVED" ? "default" : "outline"}>
            {vendor.approvalStatus}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact Person</span>
              <span>{vendor.contactPersonName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{vendor.email ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{vendor.phone ?? "—"}</span>
            </div>
            {profile && (
              <>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-muted-foreground">Legal Name</span>
                  <span>{profile.legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business Type</span>
                  <span>{profile.businessType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST</span>
                  <span>{profile.gstNumber ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City</span>
                  <span>{profile.city}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <PerformanceSummary orders={orders?.data ?? []} total={orders?.meta.total ?? 0} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersError ? (
            <ErrorState title="Failed to load orders" description="Could not fetch vendor orders." onRetry={() => refetchOrders()} />
          ) : ordersLoading ? (
            <LoadingState rows={4} />
          ) : (
            <DataTable
              columns={orderColumns}
              data={orders?.data ?? []}
              totalRows={orders?.meta.total ?? 0}
              pageIndex={page}
              pageSize={20}
              onPageChange={setPage}
              emptyTitle="No orders"
              emptyDescription="No orders assigned to this vendor."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
