"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  DataTable,
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
import type { ColumnDef } from "@tanstack/react-table";
import type { RateUnit, Region } from "@cj/types";
import { Region as RegionEnum } from "@cj/types";
import { Pencil, Plus } from "lucide-react";

import { useSetVendorOwnRate, useVendorRates } from "@/features/queries";

const REGIONS = Object.values(RegionEnum);
const unitLabel = (u: RateUnit | string) => (u ? u.replace(/_/g, " ").toLowerCase() : "");

interface VendorRateRow {
  id: string;
  label: string;
  calcUnit: RateUnit;
  calcWidth?: string | null;
  calcHeight?: string | null;
  measUnit: RateUnit;
  measWidth?: string | null;
  measHeight?: string | null;
  vendorRates: { rateId: string; region: Region; rate: string; vendorId: string; vendorName: string }[];
}

function RateEditDialog({
  rate,
  open,
  onOpenChange,
}: {
  rate: VendorRateRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setOwn = useSetVendorOwnRate();
  const [values, setValues] = React.useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const r of REGIONS) {
      const existing = rate.vendorRates.find((vr) => vr.region === r);
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
          <DialogDescription>{rate.label}</DialogDescription>
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

export default function VendorRatesPage() {
  const { data, isLoading, isError, refetch } = useVendorRates();
  const rates = (data ?? []) as unknown as VendorRateRow[];
  const [selectedId, setSelectedId] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<VendorRateRow | null>(null);

  const selected = rates.find((r) => r.id === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId(id);
    const rate = rates.find((r) => r.id === id);
    if (rate) setEditing(rate);
  }

  const columns: ColumnDef<VendorRateRow>[] = [
    {
      accessorKey: "label",
      header: "Rate",
      cell: ({ row }) => {
        const fmtNum = (val: string | number | null | undefined) =>
          val != null && val !== "" ? String(Number(val)) : "—";
        const calcSize =
          row.original.calcWidth || row.original.calcHeight
            ? ` (${fmtNum(row.original.calcWidth)} x ${fmtNum(row.original.calcHeight)})`
            : "";
        const measSize =
          row.original.measWidth || row.original.measHeight
            ? ` (${fmtNum(row.original.measWidth)} x ${fmtNum(row.original.measHeight)})`
            : "";
        return (
          <div>
            <p className="font-medium">{row.original.label}</p>
            <p className="text-muted-foreground text-xs">
              {unitLabel(row.original.calcUnit)}
              {calcSize} · {unitLabel(row.original.measUnit)}
              {measSize}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "vendorRates",
      header: "My Rates",
      cell: ({ row }) => {
        const rs = row.original.vendorRates;
        if (rs.length === 0) return <Badge variant="outline">Not set</Badge>;
        return (
          <div className="space-y-0.5">
            {rs.map((r, i) => (
              <div key={i} className="text-xs">
                <span className="text-muted-foreground">{unitLabel(r.region)}:</span>{" "}
                <span className="font-medium">₹{Number(r.rate).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(row.original)}>
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rate Card"
        description="Pick a rate to set your own price per region"
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
                  Select a rate label to set your own price for it.
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
                    <p className="text-muted-foreground text-xs">
                      {unitLabel(selected.calcUnit)}
                      {selected.calcWidth || selected.calcHeight
                        ? ` (${selected.calcWidth ?? "—"} x ${selected.calcHeight ?? "—"})`
                        : ""}{" "}
                      · {unitLabel(selected.measUnit)}
                      {selected.measWidth || selected.measHeight
                        ? ` (${selected.measWidth ?? "—"} x ${selected.measHeight ?? "—"})`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button onClick={() => { setAdding(false); if (selected) setEditing(selected); }} disabled={!selected}>
                  Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DataTable
            columns={columns}
            data={rates}
            totalRows={rates.length}
            pageIndex={1}
            pageSize={20}
            emptyTitle="No rates yet"
            emptyDescription="The admin catalog is empty right now."
          />

          {editing && (
            <RateEditDialog rate={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
          )}
        </>
      )}
    </div>
  );
}