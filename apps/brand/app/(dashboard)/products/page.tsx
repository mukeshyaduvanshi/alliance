"use client";

import * as React from "react";
import { toast } from "sonner";
import {
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
import { Pencil, Plus } from "lucide-react";

import { useBrandRates, useSetBrandOwnRate } from "@/features/queries";

const REGIONS = Object.values(RegionEnum);
const unitLabel = (u: RateUnit | string) => u.replace(/_/g, " ");

interface BrandRateRow {
  id: string;
  label: string;
  calcUnit: RateUnit;
  calcWidth?: string | null;
  calcHeight?: string | null;
  measUnit: RateUnit;
  measWidth?: string | null;
  measHeight?: string | null;
  brandRates: { rateId: string; region: Region; rate: string; brandId: string; brandName: string }[];
}

function sizeText(r: BrandRateRow) {
  const calcSize =
    r.calcWidth || r.calcHeight
      ? `${r.calcWidth ?? "—"} x ${r.calcHeight ?? "—"}`
      : null;
  const measSize =
    r.measWidth || r.measHeight
      ? `${r.measWidth ?? "—"} x ${r.measHeight ?? "—"}`
      : null;
  return [
    `${unitLabel(r.calcUnit)}${calcSize ? ` (${calcSize})` : ""}`,
    `${unitLabel(r.measUnit)}${measSize ? ` (${measSize})` : ""}`,
  ].join(" · ");
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
          setOwn.mutateAsync({ rateId: rate.id, region: r, rate: Number(values[r]) })
        )
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set My Rates</DialogTitle>
          <DialogDescription>
            {rate.label} — {sizeText(rate)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {REGIONS.map((r) => (
            <div key={r} className="flex items-center justify-between gap-3">
              <Label className="w-40 shrink-0 text-xs font-medium">{unitLabel(r)}</Label>
              <Input
                type="number"
                min={0}
                value={values[r] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [r]: e.target.value }))}
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

export default function BrandProductsPage() {
  const { data, isLoading, isError, refetch } = useBrandRates();
  const rates = (data ?? []) as unknown as BrandRateRow[];
  const [selectedId, setSelectedId] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<BrandRateRow | null>(null);

  const selected = rates.find((r) => r.id === selectedId) ?? null;
  const added = rates.filter((r) => r.brandRates.length > 0);

  function handleSelect(id: string) {
    setSelectedId(id);
    const rate = rates.find((r) => r.id === id);
    if (rate) setEditing(rate);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rate Card"
        description="Select a rate label from the catalog and set your own price per region"
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add Rate
          </Button>
        }
      />
      {isError ? (
        <ErrorState title="Failed to load rate card" description="Could not fetch rates." onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <>
          <Dialog open={adding} onOpenChange={setAdding}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Rate</DialogTitle>
                <DialogDescription>
                  Select a rate label and set your own price for each region.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Rate</Label>
                  <Select value={selectedId || undefined} onValueChange={handleSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a rate" />
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
                    <p className="text-muted-foreground text-xs">{sizeText(selected)}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setAdding(false);
                    if (selected) setEditing(selected);
                  }}
                  disabled={!selected}
                >
                  Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="rounded-md border">
            {added.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                You have not set any rates yet. Click "Add Rate" to start.
              </p>
            ) : (
              <div className="divide-y">
                {added.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium">{r.label}</p>
                      <p className="text-muted-foreground text-xs">{sizeText(r)}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                        {r.brandRates.map((br, i) => (
                          <span key={i} className="text-xs">
                            <span className="text-muted-foreground">{unitLabel(br.region)}:</span>{" "}
                            <span className="font-medium">₹{Number(br.rate).toLocaleString("en-IN")}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(r)}>
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editing && (
            <RateEditDialog rate={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
          )}
        </>
      )}
    </div>
  );
}