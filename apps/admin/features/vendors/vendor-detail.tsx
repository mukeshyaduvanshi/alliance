"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Check, UserRound, X, Plus } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorState,
  Input,
  Label,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@cj/ui";
import { BusinessModelType } from "@cj/types";
import type { Region, VendorDto } from "@cj/types";
import { Region as RegionEnum } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import { useInternalUsers } from "../brands/queries";
import {
  useApproveVendor,
  useAssignVendorManagers,
  useAssignVendorRate,
  useProductsForRates,
  useRemoveVendorManager,
  useRejectVendor,
  useSetVendorBusinessModel,
  useVendor,
  useVendorBusinessModel,
  useVendorManagers,
  useVendorRates,
} from "./queries";

const BUSINESS_MODEL_OPTIONS = Object.values(BusinessModelType);
const REGIONS = Object.values(RegionEnum);

function AssignRateDialog({
  vendorId,
  open,
  onOpenChange,
}: {
  vendorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const assignRate = useAssignVendorRate();
  const { data: products } = useProductsForRates();
  const [productId, setProductId] = React.useState("");
  const [region, setRegion] = React.useState<Region | "">("");
  const [rate, setRate] = React.useState("");

  async function handleSubmit() {
    if (!productId || !region || !rate) return;
    try {
      await assignRate.mutateAsync({
        vendorId,
        data: { productId, region, rate: Number(rate) },
      });
      toast.success("Rate assigned");
      setProductId("");
      setRegion("");
      setRate("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign rate");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Rate</DialogTitle>
          <DialogDescription>
            Assign a payout rate for a product in a region.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={productId || undefined} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products?.data?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={region || undefined} onValueChange={(v) => setRegion(v as Region)}>
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Rate (₹)</Label>
            <Input
              id="rate"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 450"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!productId || !region || !rate || assignRate.isPending}
          >
            {assignRate.isPending ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApprovalDialog({
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
        await approve.mutateAsync({ id: vendor.id, remarks: remarks || undefined });
        toast.success("Vendor approved");
      } else {
        await reject.mutateAsync({ id: vendor.id, remarks: remarks || undefined });
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

export function VendorDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: vendor, isLoading, isError, refetch } = useVendor(id);
  const { data: users } = useInternalUsers();
  const { data: businessModel, refetch: refetchBm } = useVendorBusinessModel(id);
  const setBusinessModel = useSetVendorBusinessModel();
  const { data: managers, refetch: refetchManagers } = useVendorManagers(id);
  const assignManagers = useAssignVendorManagers();
  const removeManager = useRemoveVendorManager();

  const [selectedModel, setSelectedModel] = React.useState<string>("");
  const [commission, setCommission] = React.useState<string>("");
  const [markup, setMarkup] = React.useState<string>("");
  const [kamUserId, setKamUserId] = React.useState<string>("");
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [decision, setDecision] = React.useState<"APPROVE" | "REJECT" | null>(null);

  const {
    data: rates,
    isLoading: ratesLoading,
    isError: ratesError,
    refetch: refetchRates,
  } = useVendorRates(id);

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
        vendorId: id,
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
      toast.error("This user is already assigned to this vendor");
      return;
    }
    try {
      await assignManagers.mutateAsync({ vendorId: id, userIds: [kamUserId] });
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
      await removeManager.mutateAsync({ vendorId: id, userId });
      toast.success("Manager removed");
      refetchManagers();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove manager");
    }
  }

  if (isError) {
    return (
      <ErrorState title="Failed to load vendor" description="Could not fetch vendor details." onRetry={() => refetch()} />
    );
  }

  if (isLoading) return <LoadingState rows={4} />;

  if (!vendor) return null;

  const bp = vendor.businessProfile;

  return (
    <div className="space-y-6">
      <PageHeader
        title={vendor.vendorName}
        description={`${vendor.id.slice(0, 8)} · ${vendor.email ?? "—"}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
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
              <span className="text-muted-foreground">Contact Person</span>
              <span>{vendor.contactPersonName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{vendor.phone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="text-right">
                {bp ? `${bp.addressLine1}, ${bp.city}, ${bp.state} ${bp.pincode}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approval</span>
              <div className="flex items-center gap-2">
                <Badge variant={vendor.approvalStatus === "APPROVED" ? "default" : "outline"}>
                  {vendor.approvalStatus}
                </Badge>
                {vendor.approvalStatus === "PENDING" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 gap-1 px-2 text-xs"
                      onClick={() => setDecision("APPROVE")}
                    >
                      <Check className="size-3 text-emerald-500" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 gap-1 px-2 text-xs"
                      onClick={() => setDecision("REJECT")}
                    >
                      <X className="size-3 text-red-500" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registered</span>
              <span>{formatDateTime(vendor.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

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
      </div>

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
                No managers assigned yet. Add a manager to give them visibility of this vendor.
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

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Assigned Rates</CardTitle>
          <Button onClick={() => setAssignOpen(true)}>
            <Plus className="size-4" />
            Assign Rate
          </Button>
        </CardHeader>
        <CardContent>
          {assignOpen && (
            <AssignRateDialog vendorId={id} open={assignOpen} onOpenChange={setAssignOpen} />
          )}
          {ratesError ? (
            <ErrorState title="Failed to load rates" description="Could not fetch vendor rates." onRetry={() => refetchRates()} />
          ) : ratesLoading ? (
            <LoadingState rows={4} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rates ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.productName}</TableCell>
                    <TableCell>{r.category ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.region}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.rate != null ? formatINR(r.rate) : "—"}
                    </TableCell>
                    <TableCell>{formatDateTime(r.updatedAt)}</TableCell>
                  </TableRow>
                ))}
                {!rates?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      No rates assigned. Assign the first rate.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {decision && vendor && (
        <ApprovalDialog
          vendor={vendor}
          decision={decision}
          open={true}
          onOpenChange={(open) => !open && setDecision(null)}
        />
      )}
    </div>
  );
}
