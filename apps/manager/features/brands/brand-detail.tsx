"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

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
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@cj/ui";
import type { OrderDto, PurchaseOrderDto, RateDto, Region } from "@cj/types";
import { ApiClientError, formatDateTime, formatINR } from "@cj/utils";

import { usePermission } from "@/lib/permissions";

import {
  useApproveBrand,
  useBrand,
  useBrandBusinessModel,
  useBrandOrders,
  useBrandPurchaseOrders,
  useBrandRateComparison,
  useRejectBrand,
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

function BrandApprovalDialog({
  brand,
  decision,
  open,
  onOpenChange,
}: {
  brand: NonNullable<ReturnType<typeof useBrand>["data"]>;
  decision: "APPROVE" | "REJECT";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [remarks, setRemarks] = React.useState("");
  const approve = useApproveBrand();
  const reject = useRejectBrand();
  const isApprove = decision === "APPROVE";

  async function handleSubmit() {
    try {
      if (isApprove) {
        await approve.mutateAsync({ id: brand.id, remarks: remarks || undefined });
        toast.success("Brand approved");
      } else {
        await reject.mutateAsync({ id: brand.id, remarks: remarks || undefined });
        toast.success("Brand rejected");
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
            {isApprove ? "Approve" : "Reject"} {brand.brandName}
          </DialogTitle>
          <DialogDescription>
            {brand.contactPersonName} · {brand.email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Remarks (optional)
            <Textarea
              className="mt-1.5"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={isApprove ? "Approval remarks..." : "Reason for rejection..."}
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

function unitLabel(u: string) {
  return u ? u.replace(/_/g, " ").toLowerCase() : "";
}

function fmtNum(val: string | number | null | undefined) {
  return val != null && val !== "" ? String(Number(val)) : "—";
}

function BrandRatesCard({ brandId }: { brandId: string }) {
  const { data: rates, isLoading, isError, refetch } = useBrandRateComparison(brandId);

  if (isLoading) return <LoadingState rows={4} />;
  if (isError) return <ErrorState title="Failed to load rates" description="Could not fetch brand rates." onRetry={() => refetch()} />;

  if (!rates || rates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground font-medium">No rates configured</p>
          <p className="text-muted-foreground text-xs">This brand has no active rate catalog entries.</p>
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
                    Region-wise Rate Comparison (Brand Rate vs Master Rate)
                  </p>
                  {rateItem.regions && rateItem.regions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                      {rateItem.regions.map((r: { id: string; region: Region; rate: string }) => {
                        const brandRateObj = rateItem.brandRates?.find((br) => br.region === r.region);
                        const masterRateNum = Number(r.rate);
                        const brandRateNum = brandRateObj ? Number(brandRateObj.rate) : null;

                        let colorClass = "text-foreground font-semibold";
                        let bgClass = "bg-muted/40 border-muted";

                        if (brandRateNum !== null) {
                          if (brandRateNum > masterRateNum) {
                            colorClass = "text-red-600 font-bold";
                            bgClass = "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50";
                          } else if (brandRateNum < masterRateNum) {
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
                                <span className="text-[10px] text-muted-foreground block">Brand Rate</span>
                                {brandRateNum !== null ? (
                                  <span className={`text-base ${colorClass}`}>
                                    ₹{brandRateNum.toLocaleString("en-IN")}
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

export function BrandDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = React.useState("overview");
  const [poPage, setPoPage] = React.useState(1);
  const [orderPage, setOrderPage] = React.useState(1);
  const [decision, setDecision] = React.useState<"APPROVE" | "REJECT" | null>(null);

  const canApprove = usePermission("brand", "APPROVE");
  const canReject = usePermission("brand", "REJECT");

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
          <div className="flex items-center gap-2">
            {(canApprove || canReject) && brand.approvalStatus === "PENDING" && (
              <>
                {canApprove && (
                  <Button size="sm" onClick={() => setDecision("APPROVE")}>
                    <Check className="size-4" />
                    Approve
                  </Button>
                )}
                {canReject && (
                  <Button size="sm" variant="destructive" onClick={() => setDecision("REJECT")}>
                    <X className="size-4" />
                    Reject
                  </Button>
                )}
              </>
            )}
            <Badge variant={brand.approvalStatus === "APPROVED" ? "default" : brand.approvalStatus === "REJECTED" ? "destructive" : "outline"}>
              {brand.approvalStatus}
            </Badge>
          </div>
        }
      />

      {decision && (
        <BrandApprovalDialog
          brand={brand}
          decision={decision}
          open={true}
          onOpenChange={(open) => !open && setDecision(null)}
        />
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
          <TabsTrigger value="business-model">Business Model</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <ContactCard brand={brand} />
        </TabsContent>

        <TabsContent value="rates" className="pt-4">
          <BrandRatesCard brandId={id} />
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
