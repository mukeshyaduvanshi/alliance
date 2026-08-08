"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

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
} from "@cj/ui";
import type { Region } from "@cj/types";
import { Region as RegionEnum } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import {
  useAssignVendorRate,
  useProductsForRates,
  useVendor,
  useVendorRates,
} from "./queries";

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
            <Select value={region || undefined} onValueChange={(v) => setRegion(v as Region)}>              <SelectTrigger>
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

export function VendorDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [assignOpen, setAssignOpen] = React.useState(false);

  const { data: vendor, isLoading, isError, refetch } = useVendor(id);
  const {
    data: rates,
    isLoading: ratesLoading,
    isError: ratesError,
    refetch: refetchRates,
  } = useVendorRates(id);

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

        <Card className="lg:col-span-2">
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
      </div>
    </div>
  );
}
