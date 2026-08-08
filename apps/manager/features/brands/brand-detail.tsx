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
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@cj/ui";
import type { OrderDto, PurchaseOrderDto } from "@cj/types";
import { ApiClientError, formatDateTime, formatINR } from "@cj/utils";

import {
  useBrand,
  useBrandBusinessModel,
  useBrandOrders,
  useBrandPurchaseOrders,
} from "./queries";

const poColumns: ColumnDef<PurchaseOrderDto>[] = [
  {
    accessorKey: "poNumber",
    header: "PO Number",
    cell: ({ row }) => <span className="font-medium">{row.original.poNumber}</span>,
  },
  {
    accessorKey: "totalBudget",
    header: "Budget",
    cell: ({ row }) => formatINR(row.original.totalBudget),
  },
  {
    accessorKey: "consumedAmount",
    header: "Consumed",
    cell: ({ row }) => formatINR(row.original.consumedAmount),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
];

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
];

function ContactCard({ brand }: { brand: NonNullable<ReturnType<typeof useBrand>["data"]> }) {
  const profile = brand.businessProfile;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact & Business Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Contact Person</p>
            <p>{brand.contactPersonName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p>{brand.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone</p>
            <p>{brand.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Approval</p>
            <Badge variant={brand.approvalStatus === "APPROVED" ? "default" : "outline"}>
              {brand.approvalStatus}
            </Badge>
          </div>
        </div>
        {profile && (
          <div className="border-t pt-3">
            <p className="text-muted-foreground mb-2">Business Profile</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Legal Name</p>
                <p>{profile.legalName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Business Type</p>
                <p>{profile.businessType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">GST</p>
                <p>{profile.gstNumber ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">PAN</p>
                <p>{profile.panNumber ?? "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Address</p>
                <p>
                  {profile.addressLine1}
                  {profile.addressLine2 ? `, ${profile.addressLine2}` : ""},{" "}
                  {profile.city}, {profile.state} {profile.pincode}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BusinessModelCard({ brandId }: { brandId: string }) {
  const { data, isLoading, isError, error } = useBrandBusinessModel(brandId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Model</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (
    isError &&
    error instanceof ApiClientError &&
    error.status === 404
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Model</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No business model configured for this brand yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Model</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Could not load business model configuration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Model</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Model</span>
          <Badge variant="outline">{data.businessModel}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Commission %</span>
          <span>{data.commissionPercent ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Markup %</span>
          <span>{data.markupPercent ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Effective From</span>
          <span>{formatDateTime(data.effectiveFrom)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function BrandDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = React.useState("overview");
  const [poPage, setPoPage] = React.useState(1);
  const [orderPage, setOrderPage] = React.useState(1);

  const { data: brand, isLoading, isError, refetch } = useBrand(id);
  const { data: pos, isLoading: poLoading, isError: poError, refetch: refetchPos } = useBrandPurchaseOrders(id, poPage);
  const { data: orders, isLoading: ordersLoading, isError: ordersError, refetch: refetchOrders } = useBrandOrders(id, orderPage);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load brand"
        description="Could not fetch brand details."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading || !brand) return <LoadingState rows={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={brand.brandName}
        description={`${brand.id.slice(0, 8)} · ${brand.email}`}
        actions={
          <Badge variant={brand.approvalStatus === "APPROVED" ? "default" : "outline"}>
            {brand.approvalStatus}
          </Badge>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business-model">Business Model</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <ContactCard brand={brand} />
        </TabsContent>

        <TabsContent value="business-model" className="pt-4">
          <BusinessModelCard brandId={id} />
        </TabsContent>

        <TabsContent value="pos" className="space-y-4 pt-4">
          {poError ? (
            <ErrorState title="Failed to load purchase orders" description="Could not fetch POs." onRetry={() => refetchPos()} />
          ) : poLoading ? (
            <LoadingState rows={4} />
          ) : (
            <DataTable
              columns={poColumns}
              data={pos?.data ?? []}
              totalRows={pos?.meta.total ?? 0}
              pageIndex={poPage}
              pageSize={20}
              onPageChange={setPoPage}
              emptyTitle="No purchase orders"
              emptyDescription="No POs found for this brand."
            />
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 pt-4">
          {ordersError ? (
            <ErrorState title="Failed to load orders" description="Could not fetch orders." onRetry={() => refetchOrders()} />
          ) : ordersLoading ? (
            <LoadingState rows={4} />
          ) : (
            <DataTable
              columns={orderColumns}
              data={orders?.data ?? []}
              totalRows={orders?.meta.total ?? 0}
              pageIndex={orderPage}
              pageSize={20}
              onPageChange={setOrderPage}
              emptyTitle="No orders"
              emptyDescription="No orders found for this brand."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
