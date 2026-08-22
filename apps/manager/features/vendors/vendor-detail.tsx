"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Check, Package, ShoppingCart, Wallet, X } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@cj/ui";
import type { OrderDto, OrderStatus, RateDto, Region, VendorDto } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import { usePermission } from "@/lib/permissions";

import {
  useApproveVendor,
  useRejectVendor,
  useVendor,
  useVendorOrders,
  useVendorRateComparison,
} from "./queries";

const orderColumns: ColumnDef<OrderDto>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.orderNumber}</p>
        <p className="text-muted-foreground text-xs">
          {row.original.siteLocation}
        </p>
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
      <Badge
        variant={
          row.original.status === "CANCELLED" ? "destructive" : "outline"
        }
      >
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

function unitLabel(u: string) {
  return u ? u.replace(/_/g, " ").toLowerCase() : "";
}

function fmtNum(val: string | number | null | undefined) {
  return val != null && val !== "" ? String(Number(val)) : "—";
}

function VendorRatesCard({ vendorId }: { vendorId: string }) {
  const { data: rates, isLoading, isError, refetch } = useVendorRateComparison(vendorId);

  if (isLoading) return <LoadingState rows={4} />;
  if (isError) return <ErrorState title="Failed to load rates" description="Could not fetch vendor rates." onRetry={() => refetch()} />;

  if (!rates || rates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground font-medium">No rates configured</p>
          <p className="text-muted-foreground text-xs">This vendor has no active rate catalog entries.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="space-y-3">
        {rates.map((rateItem: RateDto) => {
          const calcSize =
            rateItem.calcWidth || rateItem.calcHeight
              ? `${fmtNum(rateItem.calcWidth)} × ${fmtNum(rateItem.calcHeight)}`
              : null;
          const measSize =
            rateItem.measWidth || rateItem.measHeight
              ? `${fmtNum(rateItem.measWidth)} × ${fmtNum(rateItem.measHeight)}`
              : null;

          return (
            <AccordionItem
              key={rateItem.id}
              value={rateItem.id}
              className="rounded-lg border bg-card px-4 py-2 shadow-xs transition-all hover:shadow-sm"
            >
              <AccordionTrigger className="flex items-center justify-between gap-4 py-3 hover:no-underline">
                <div className="flex flex-1 flex-col text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground text-base">
                      {rateItem.label}
                    </span>
                    <Badge variant={rateItem.isActive ? "default" : "secondary"}>
                      {rateItem.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-xs mt-1">
                    Calc: <strong className="text-foreground">{unitLabel(rateItem.calcUnit)}</strong>
                    {calcSize ? ` (${calcSize})` : ""} · Meas:{" "}
                    <strong className="text-foreground">{unitLabel(rateItem.measUnit)}</strong>
                    {measSize ? ` (${measSize})` : ""}
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-2 pb-3 border-t mt-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                    Region-wise Rate Comparison (Vendor Rate vs Master Rate)
                  </p>
                  {rateItem.regions && rateItem.regions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                      {rateItem.regions.map((r: { id: string; region: Region; rate: string }) => {
                        const vendorRateObj = rateItem.vendorRates?.find((vr) => vr.region === r.region);
                        const masterRateNum = Number(r.rate);
                        const vendorRateNum = vendorRateObj ? Number(vendorRateObj.rate) : null;

                        let colorClass = "text-foreground font-semibold";
                        let bgClass = "bg-muted/40 border-muted";

                        if (vendorRateNum !== null) {
                          if (vendorRateNum > masterRateNum) {
                            colorClass = "text-red-600 font-bold";
                            bgClass = "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50";
                          } else if (vendorRateNum < masterRateNum) {
                            colorClass = "text-emerald-600 font-bold";
                            bgClass = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50";
                          }
                        }

                        return (
                          <div
                            key={r.id}
                            className={`flex flex-col rounded-md border p-3 ${bgClass} transition-colors`}
                          >
                            <span className="text-xs font-semibold text-muted-foreground">
                              {unitLabel(r.region)}
                            </span>
                            <div className="mt-1 flex items-baseline justify-between gap-2">
                              <div>
                                <span className="text-[10px] text-muted-foreground block">Master Rate</span>
                                <span className="text-sm font-medium text-foreground">
                                  ₹{masterRateNum.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-muted-foreground block">Vendor Rate</span>
                                {vendorRateNum !== null ? (
                                  <span className={`text-base ${colorClass}`}>
                                    ₹{vendorRateNum.toLocaleString("en-IN")}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Not set</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No region rates configured for this item.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function PerformanceSummary({
  orders,
  total,
}: {
  orders: OrderDto[];
  total: number;
}) {
  const totals: Record<OrderStatus, number> = {} as Record<OrderStatus, number>;
  const totalValue = orders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0,
  );

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
          hint={
            partial ? `based on ${orders.length} recent orders` : "total value"
          }
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

function VendorApprovalDialog({
  vendor,
  decision,
  open,
  onOpenChange,
}: {
  vendor: VendorDto;
  decision: "APPROVE" | "REJECT";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [remarks, setRemarks] = React.useState("");
  const approve = useApproveVendor();
  const reject = useRejectVendor();
  const isApprove = decision === "APPROVE";

  async function handleSubmit() {
    try {
      if (isApprove) {
        await approve.mutateAsync({
          id: vendor.id,
          remarks: remarks || undefined,
        });
        toast.success("Vendor approved");
      } else {
        await reject.mutateAsync({
          id: vendor.id,
          remarks: remarks || undefined,
        });
        toast.success("Vendor rejected");
      }
      onOpenChange(false);
      setRemarks("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApprove ? "Approve" : "Reject"} {vendor.vendorName}
          </DialogTitle>
          <DialogDescription>
            {vendor.contactPersonName} · {vendor.email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Remarks (optional)
            <Textarea
              className="mt-1.5"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                isApprove ? "Approval remarks..." : "Reason for rejection..."
              }
              rows={3}
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? "default" : "destructive"}
            onClick={handleSubmit}
            disabled={approve.isPending || reject.isPending}
          >
            {isApprove ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VendorDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = React.useState("overview");
  const [page, setPage] = React.useState(1);
  const [decision, setDecision] = React.useState<"APPROVE" | "REJECT" | null>(
    null,
  );

  const canApprove = usePermission("vendor", "APPROVE");
  const canReject = usePermission("vendor", "REJECT");

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
          <div className="flex items-center gap-2">
            {(canApprove || canReject) &&
              vendor.approvalStatus === "PENDING" && (
                <>
                  {canApprove && (
                    <Button size="sm" onClick={() => setDecision("APPROVE")}>
                      <Check className="size-4" />
                      Approve
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDecision("REJECT")}
                    >
                      <X className="size-4" />
                      Reject
                    </Button>
                  )}
                </>
              )}
            <Badge
              variant={
                vendor.approvalStatus === "APPROVED" ? "default" : "outline"
              }
            >
              {vendor.approvalStatus}
            </Badge>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
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
              <PerformanceSummary
                orders={orders?.data ?? []}
                total={orders?.meta.total ?? 0}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rates" className="pt-4">
          <VendorRatesCard vendorId={id} />
        </TabsContent>

        <TabsContent value="orders" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersError ? (
                <ErrorState
                  title="Failed to load orders"
                  description="Could not fetch vendor orders."
                  onRetry={() => refetchOrders()}
                />
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
        </TabsContent>
      </Tabs>

      {decision && vendor && (
        <VendorApprovalDialog
          vendor={vendor}
          decision={decision}
          open={true}
          onOpenChange={(open) => !open && setDecision(null)}
        />
      )}
    </div>
  );
}
