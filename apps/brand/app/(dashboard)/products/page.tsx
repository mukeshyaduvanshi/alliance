"use client";

import * as React from "react";
import { MoreHorizontal, Pencil } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import type { Region, SetBrandRateDto } from "@cj/types";
import { Region as RegionEnum } from "@cj/types";

import { useBrandProducts, useSetBrandRate } from "@/features/queries";

const REGIONS = Object.values(RegionEnum);
const regionLabel = (r: Region) => r.replace(/_/g, " ");

interface BrandProductRow {
  id: string;
  name: string;
  unit: string;
  region?: string;
  rate?: string | null;
  isCustomRate?: boolean;
  category?: { id: string; name: string } | null;
  basePrice?: string | null;
}

function SetRateDialog({
  product,
  open,
  onOpenChange,
}: {
  product: BrandProductRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setRate = useSetBrandRate();
  const [region, setRegion] = React.useState<Region>((product.region as Region) ?? "PAN_INDIA");
  const [mode, setMode] = React.useState<"standard" | "custom">(product.isCustomRate ? "custom" : "standard");
  const [custom, setCustom] = React.useState(
    product.rate ? String(Number(product.rate)) : ""
  );

  async function handleSubmit() {
    try {
      const data: SetBrandRateDto = {
        region,
        isCustomRate: mode === "custom",
        customRate: mode === "custom" ? Number(custom) : undefined,
      };
      await setRate.mutateAsync({ productId: product.id, data });
      toast.success("Rate updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save rate");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set My Rate</DialogTitle>
          <DialogDescription>
            {product.name} — choose a region and set your price.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {regionLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rate type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "standard" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("standard")}
              >
                Standard
              </Button>
              <Button
                type="button"
                variant={mode === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("custom")}
              >
                Custom
              </Button>
            </div>
          </div>
          {mode === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="custom-rate">Custom rate (₹)</Label>
              <Input
                id="custom-rate"
                type="number"
                min={0}
                placeholder="e.g. 480"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={setRate.isPending || (mode === "custom" && !custom)}
          >
            {setRate.isPending ? "Saving..." : "Save Rate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RateActions({ product }: { product: BrandProductRow }) {
  const [editOpen, setEditOpen] = React.useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Set My Rate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SetRateDialog product={product} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

const columns: ColumnDef<BrandProductRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="text-muted-foreground text-xs">{row.original.unit}</p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category?.name ?? "—",
  },
  {
    accessorKey: "region",
    header: "Region",
    cell: ({ row }) => row.original.region ? regionLabel(row.original.region as Region) : "—",
  },
  {
    accessorKey: "rate",
    header: "Your Rate",
    cell: ({ row }) => (
      <span className="font-medium">
        ₹{row.original.rate ? Number(row.original.rate).toLocaleString("en-IN") : "—"}
      </span>
    ),
  },
  {
    accessorKey: "isCustomRate",
    header: "Type",
    cell: ({ row }) =>
      row.original.isCustomRate ? (
        <Badge variant="secondary">Custom</Badge>
      ) : (
        <Badge variant="outline">Standard</Badge>
      ),
  },
  {
    id: "actions",
    cell: ({ row }) => <RateActions product={row.original} />,
  },
];

export default function BrandProductsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useBrandProducts(page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Pricing"
        description="Your negotiated rate card"
      />
      {isError ? (
        <ErrorState
          title="Failed to load rate card"
          description="Could not fetch your product rates."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <DataTable
          columns={columns}
          data={(data?.data ?? []) as unknown as BrandProductRow[]}
          totalRows={data?.meta.total ?? 0}
          pageIndex={page}
          pageSize={20}
          onPageChange={setPage}
          emptyTitle="No products available"
          emptyDescription="Your rate card is empty. Set your first rate to start ordering."
        />
      )}
    </div>
  );
}