"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  CardContent,
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
} from "@cj/ui";
import type { SubscriptionPlanDto } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import { usePermission } from "@/lib/permissions";

import {
  useCreateLicense,
  useCreatePlan,
  useLicense,
  usePlans,
} from "@/features/system/queries";

function CreatePlanDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createPlan = useCreatePlan();
  const [name, setName] = React.useState("");
  const [maxUsers, setMaxUsers] = React.useState("");
  const [maxBrands, setMaxBrands] = React.useState("");
  const [maxVendors, setMaxVendors] = React.useState("");
  const [priceMonthly, setPriceMonthly] = React.useState("");

  async function handleSubmit() {
    if (!name) return;
    try {
      await createPlan.mutateAsync({
        name,
        maxUsers: Number(maxUsers) || 1,
        maxBrands: Number(maxBrands) || 1,
        maxVendors: Number(maxVendors) || 1,
        priceMonthly: Number(priceMonthly) || 0,
      });
      toast.success("Plan created");
      setName("");
      setMaxUsers("");
      setMaxBrands("");
      setMaxVendors("");
      setPriceMonthly("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create plan");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Subscription Plan</DialogTitle>
          <DialogDescription>
            Add a new subscription plan for tenants.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planName">Plan Name</Label>
            <Input id="planName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pro" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="maxUsers">Max Users</Label>
              <Input id="maxUsers" type="number" value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBrands">Max Brands</Label>
              <Input id="maxBrands" type="number" value={maxBrands} onChange={(e) => setMaxBrands(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxVendors">Max Vendors</Label>
              <Input id="maxVendors" type="number" value={maxVendors} onChange={(e) => setMaxVendors(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price / Month</Label>
              <Input id="price" type="number" value={priceMonthly} onChange={(e) => setPriceMonthly(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!name || createPlan.isPending}>
            {createPlan.isPending ? "Creating..." : "Create Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateLicenseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createLicense = useCreateLicense();
  const { data: plans } = usePlans();
  const [planId, setPlanId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");

  async function handleSubmit() {
    if (!planId || !startDate || !expiryDate) return;
    try {
      await createLicense.mutateAsync({ planId, startDate, expiryDate });
      toast.success("License created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create license");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create License</DialogTitle>
          <DialogDescription>
            Assign a subscription plan to this tenant.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Plan</Label>
            <select
              className="border-input bg-background ring-offset-background flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            >
              <option value="">Select plan</option>
              {plans?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!planId || !startDate || !expiryDate || createLicense.isPending}>
            {createLicense.isPending ? "Creating..." : "Create License"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SubscriptionPlans() {
  const [open, setOpen] = React.useState(false);
  const canCreate = usePermission("system_admin", "CREATE");
  const { data, isLoading, isError, refetch } = usePlans();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        description="Available plans for tenants"
        actions={
          canCreate && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              New Plan
            </Button>
          )
        }
      />
      {open && <CreatePlanDialog open={open} onOpenChange={setOpen} />}
      {isError ? (
        <ErrorState title="Failed to load plans" description="Could not fetch subscription plans." onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : !data?.length ? (
        <div className="rounded-md border p-12 text-center text-muted-foreground text-sm">
          No subscription plans yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p: SubscriptionPlanDto) => (
            <Card key={p.id}>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{p.name}</p>
                  <Badge variant={p.isActive ? "default" : "secondary"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-2xl font-semibold">{formatINR(p.priceMonthly)}</p>
                <p className="text-muted-foreground text-xs">
                  {p.maxUsers} users · {p.maxBrands} brands · {p.maxVendors} vendors
                </p>
                <p className="text-muted-foreground text-xs">
                  Created {formatDateTime(p.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function Licenses() {
  const [open, setOpen] = React.useState(false);
  const canCreate = usePermission("system_admin", "CREATE");
  const { data: license, isLoading, isError, error, refetch } = useLicense();

  const notFound = isError && (error as { status?: number })?.status === 404;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licenses"
        description="Current tenant license"
        actions={
          canCreate && !license && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Create License
            </Button>
          )
        }
      />
      {open && <CreateLicenseDialog open={open} onOpenChange={setOpen} />}
      {isLoading ? (
        <LoadingState rows={4} />
      ) : notFound ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-sm">
              No license for this tenant yet. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : isError || !license ? (
        <ErrorState title="Failed to load license" description="Could not fetch the license." onRetry={() => refetch()} />
      ) : (
        <Card>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{license.plan?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={license.status === "ACTIVE" ? "default" : license.status === "EXPIRED" ? "destructive" : "outline"}>
                {license.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span>{formatDateTime(license.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expiry Date</span>
              <span>{formatDateTime(license.expiryDate)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
