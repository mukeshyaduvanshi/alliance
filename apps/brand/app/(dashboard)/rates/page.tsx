"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
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
} from "@cj/ui";
import type { RateUnit, Region } from "@cj/types";
import { Region as RegionEnum } from "@cj/types";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { useBrandRates, useDeleteBrandOwnRate, useSetBrandOwnRate } from "@/features/queries";

const REGIONS = Object.values(RegionEnum);
const unitLabel = (u: RateUnit | string) =>
  u ? u.replace(/_/g, " ").toLowerCase() : "";

interface BrandRateRow {
  id: string;
  label: string;
  calcUnit: RateUnit;
  calcWidth?: string | null;
  calcHeight?: string | null;
  measUnit: RateUnit;
  measWidth?: string | null;
  measHeight?: string | null;
  brandRates: {
    rateId: string;
    region: Region;
    rate: string;
    brandId: string;
    brandName: string;
  }[];
}

function sizeText(r: BrandRateRow) {
  const fmtNum = (val: string | number | null | undefined) =>
    val != null && val !== "" ? String(Number(val)) : "—";
  const calcSize =
    r.calcWidth || r.calcHeight
      ? `${fmtNum(r.calcWidth)} x ${fmtNum(r.calcHeight)}`
      : null;
  const measSize =
    r.measWidth || r.measHeight
      ? `${fmtNum(r.measWidth)} x ${fmtNum(r.measHeight)}`
      : null;
  return [
    `${unitLabel(r.calcUnit)}${calcSize ? ` (${calcSize})` : ""}`,
    `${unitLabel(r.measUnit)}${measSize ? ` (${measSize})` : ""}`,
  ].join(" · ");
}

function AddRateSingleModal({
  rates,
  open,
  onOpenChange,
}: {
  rates: BrandRateRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setOwn = useSetBrandOwnRate();
  const [selectedId, setSelectedId] = React.useState("");
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const selected = rates.find((r) => r.id === selectedId) ?? null;

  React.useEffect(() => {
    if (open) {
      setSelectedId("");
      setValues({});
    }
  }, [open]);

  function handleSelect(id: string) {
    setSelectedId(id);
    const rate = rates.find((r) => r.id === id);
    const next: Record<string, string> = {};
    if (rate) {
      for (const r of REGIONS) {
        const existing = rate.brandRates.find((br) => br.region === r);
        next[r] = existing ? String(Number(existing.rate)) : "";
      }
    }
    setValues(next);
  }

  async function handleSubmit() {
    if (!selected) return;
    try {
      setSaving(true);
      const entries = REGIONS.filter((r) => values[r] !== "");
      await Promise.all(
        entries.map((r) =>
          setOwn.mutateAsync({
            rateId: selected.id,
            region: r,
            rate: Number(values[r]),
          }),
        ),
      );
      toast.success("Rates saved");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save rates");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Rate</DialogTitle>
          <DialogDescription>
            Select a rate item and set your price per region in a single modal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Rate Item</Label>
            <Select value={selectedId ?? ""} onValueChange={handleSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a rate item" />
              </SelectTrigger>
              <SelectContent>
                {rates.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-muted-foreground text-xs font-medium pt-1">
                {sizeText(selected)}
              </p>
            )}
          </div>

          {selected && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Set Price Per Region
              </p>
              {REGIONS.map((r) => (
                <div key={r} className="flex items-center justify-between gap-3">
                  <Label className="w-40 shrink-0 text-xs font-medium">
                    {unitLabel(r)}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={values[r] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [r]: e.target.value }))
                    }
                    placeholder="Rate (₹)"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selected || saving}>
            {saving ? "Saving..." : "Save Rates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RateEditDialog({
  rate,
  open,
  onOpenChange,
}: {
  rate: BrandRateRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setOwn = useSetBrandOwnRate();
  const [values, setValues] = React.useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const r of REGIONS) {
      const existing = rate.brandRates.find((br) => br.region === r);
      next[r] = existing ? String(Number(existing.rate)) : "";
    }
    return next;
  });
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit() {
    try {
      setSaving(true);
      const entries = REGIONS.filter((r) => values[r] !== "");
      await Promise.all(
        entries.map((r) =>
          setOwn.mutateAsync({
            rateId: rate.id,
            region: r,
            rate: Number(values[r]),
          }),
        ),
      );
      toast.success("Rates updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save rates");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit My Rates</DialogTitle>
          <DialogDescription>
            {rate.label} — {sizeText(rate)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {REGIONS.map((r) => (
            <div key={r} className="flex items-center justify-between gap-3">
              <Label className="w-40 shrink-0 text-xs font-medium">
                {unitLabel(r)}
              </Label>
              <Input
                type="number"
                min={0}
                value={values[r] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [r]: e.target.value }))
                }
                placeholder="Rate (₹)"
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteBrandRateDialog({ rate }: { rate: BrandRateRow }) {
  const deleteRate = useDeleteBrandOwnRate();
  async function handleDelete() {
    try {
      await deleteRate.mutateAsync(rate.id);
      toast.success("Rate entries deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete rate");
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete custom rate?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove your custom price entries for "{rate.label}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={deleteRate.isPending}
          >
            {deleteRate.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function BrandRatesPage() {
  const { data, isLoading, isError, refetch } = useBrandRates();
  const rates = (data ?? []) as unknown as BrandRateRow[];
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<BrandRateRow | null>(null);

  const added = rates.filter((r) => r.brandRates.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rates"
        description="Select a rate item from the catalog and set your price per region"
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add Rate
          </Button>
        }
      />
      {isError ? (
        <ErrorState
          title="Failed to load rate card"
          description="Could not fetch rates."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <>
          <AddRateSingleModal
            rates={rates}
            open={adding}
            onOpenChange={setAdding}
          />

          <div className="rounded-md border">
            {added.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                You have not set any rates yet. Click "Add Rate" to start.
              </p>
            ) : (
              <div className="divide-y">
                {added.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{r.label}</p>
                      <p className="text-muted-foreground text-xs">
                        {sizeText(r)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                        {r.brandRates.map((br, i) => (
                          <span key={i} className="text-xs">
                            <span className="text-muted-foreground">
                              {unitLabel(br.region)}:
                            </span>{" "}
                            <span className="font-medium">
                              ₹{Number(br.rate).toLocaleString("en-IN")}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(r)}
                        title="Edit rate"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteBrandRateDialog rate={r} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editing && (
            <RateEditDialog
              rate={editing}
              open={!!editing}
              onOpenChange={(o) => !o && setEditing(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
