"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { UserRound, X } from "lucide-react";
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
  ErrorState,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@cj/ui";
import type { OrderDto, PurchaseOrderDto, RateDto, Region } from "@cj/types";
import { BusinessModelType } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import {
  useAssignManagers,
  useBrand,
  useBrandBusinessModel,
  useBrandManagers,
  useBrandOrders,
  useBrandPurchaseOrders,
  useBrandRateComparison,
  useInternalUsers,
  useRemoveManager,
  useSetBusinessModel,
} from "./queries";

const BUSINESS_MODEL_OPTIONS = Object.values(BusinessModelType);

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

  const { data: brand, isLoading, isError, refetch } = useBrand(id);
  const { data: users } = useInternalUsers();
  const { data: businessModel, refetch: refetchBm } = useBrandBusinessModel(id);
  const setBusinessModel = useSetBusinessModel();
  const { data: managers, refetch: refetchManagers } = useBrandManagers(id);
  const assignManagers = useAssignManagers();
  const removeManager = useRemoveManager();
  const { data: pos, isLoading: poLoading, isError: poError, refetch: refetchPos } = useBrandPurchaseOrders(id, poPage);
  const { data: orders, isLoading: ordersLoading, isError: ordersError, refetch: refetchOrders } = useBrandOrders(id, orderPage);

  const [selectedModel, setSelectedModel] = React.useState<string>("");
  const [commission, setCommission] = React.useState<string>("");
  const [markup, setMarkup] = React.useState<string>("");
  const [kamUserId, setKamUserId] = React.useState<string>("");

  React.useEffect(() => {
    if (businessModel) {
      setSelectedModel(businessModel.businessModel);
      setCommission(businessModel.commissionPercent ?? "");
      setMarkup(businessModel.markupPercent ?? "");
    }
  }, [businessModel]);

  async function handleSaveBusinessModel() {
    try {
      await setBusinessModel.mutateAsync({
        brandId: id,
        data: {
          businessModel: selectedModel as BusinessModelType,
          commissionPercent: commission ? Number(commission) : undefined,
          markupPercent: markup ? Number(markup) : undefined,
        },
      });
      toast.success("Business model saved");
      refetchBm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save business model");
    }
  }

  async function handleAddManager() {
    if (!kamUserId) return;
    const alreadyAssigned = managers?.some((m) => m.userId === kamUserId);
    if (alreadyAssigned) {
      toast.error("This user is already assigned to this brand");
      return;
    }
    try {
      await assignManagers.mutateAsync({ brandId: id, userIds: [kamUserId] });
      toast.success("Manager assigned");
      setKamUserId("");
      refetchManagers();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign manager");
    }
  }

  async function handleRemoveManager(userId: string) {
    try {
      await removeManager.mutateAsync({ brandId: id, userId });
      toast.success("Manager removed");
      refetchManagers();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove manager");
    }
  }

  if (isError) {
    return (
      <ErrorState title="Failed to load brand" description="Could not fetch brand details." onRetry={() => refetch()} />
    );
  }

  if (isLoading || !brand) return <LoadingState rows={4} />;

  const bp = brand.businessProfile;

  return (
    <div className="space-y-6">
      <PageHeader
        title={brand.brandName}
        description={brand.email}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
          <TabsTrigger value="managers">Assigned Managers</TabsTrigger>
          <TabsTrigger value="business-model">Business Model</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Legal Name</span>
                <span>{bp?.legalName ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Type</span>
                <Badge variant="outline">{bp?.businessType ?? "—"}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST</span>
                <span>{bp?.gstNumber ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PAN</span>
                <span>{bp?.panNumber ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address</span>
                <span className="text-right">
                  {bp ? `${bp.addressLine1}, ${bp.city}, ${bp.state} ${bp.pincode}` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approval</span>
                <Badge variant={brand.approvalStatus === "APPROVED" ? "default" : "outline"}>
                  {brand.approvalStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registered</span>
                <span>{formatDateTime(brand.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="pt-4">
          <BrandRatesCard brandId={id} />
        </TabsContent>

        <TabsContent value="managers" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Managers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={kamUserId || undefined} onValueChange={setKamUserId}>
                  <SelectTrigger className="w-72">
                    <SelectValue placeholder="Select manager user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.data?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddManager} disabled={!kamUserId || assignManagers.isPending}>
                  {assignManagers.isPending ? "Assigning..." : "Add Manager"}
                </Button>
              </div>

              <div className="space-y-2">
                {managers?.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No managers assigned yet. Add a manager to give them visibility of this brand.
                  </p>
                )}
                {managers?.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <UserRound className="size-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{m.fullName}</p>
                        <p className="text-muted-foreground text-xs">
                          {m.email}
                          {m.role ? ` · ${m.role.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveManager(m.userId)}
                      disabled={removeManager.isPending}
                    >
                      <X className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business-model" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedModel || undefined} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business model" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_MODEL_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(selectedModel === "MEDIATOR_MODEL" || selectedModel === "HYBRID_MODEL") && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Commission % (0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                  />
                </div>
              )}
              {(selectedModel === "VENDOR_MODEL" || selectedModel === "HYBRID_MODEL") && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Markup % (0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2"
                    value={markup}
                    onChange={(e) => setMarkup(e.target.value)}
                  />
                </div>
              )}
              <Button onClick={handleSaveBusinessModel} disabled={!selectedModel || setBusinessModel.isPending}>
                {setBusinessModel.isPending ? "Saving..." : "Save Business Model"}
              </Button>
            </CardContent>
          </Card>
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
