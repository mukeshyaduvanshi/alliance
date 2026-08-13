"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ErrorState,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import type { CreateRateDto, RateDto, RateUnit, Region, RateQuoteDto } from "@cj/types";
import { RateUnit as RateUnitEnum, Region as RegionEnum } from "@cj/types";

import { useCreateRate, useDeleteRate, useRates, useUpdateRate } from "./rates-queries";

const REGIONS = Object.values(RegionEnum);
const RATE_UNITS = Object.values(RateUnitEnum);
const unitLabel = (u: RateUnit | string) => u.replace(/_/g, " ");

const rateSchema = z.object({
  label: z.string().min(2, "Label required"),
  calcUnit: z.string().min(1, "Calculation unit required"),
  calcWidth: z.string().optional(),
  calcHeight: z.string().optional(),
  measUnit: z.string().min(1, "Measurement unit required"),
  measWidth: z.string().optional(),
  measHeight: z.string().optional(),
});

type RateValues = z.infer<typeof rateSchema>;

function RateFormDialog({
  rate,
  open,
  onOpenChange,
}: {
  rate?: RateDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createRate = useCreateRate();
  const updateRate = useUpdateRate();
  const [regionRates, setRegionRates] = React.useState<{ region: Region; rate: string }[]>([]);
  const form = useForm<RateValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: { label: "", calcUnit: "", calcWidth: "", calcHeight: "", measUnit: "", measWidth: "", measHeight: "" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        label: rate?.label ?? "",
        calcUnit: rate?.calcUnit ?? "",
        calcWidth: rate?.calcWidth ? String(rate.calcWidth) : "",
        calcHeight: rate?.calcHeight ? String(rate.calcHeight) : "",
        measUnit: rate?.measUnit ?? "",
        measWidth: rate?.measWidth ? String(rate.measWidth) : "",
        measHeight: rate?.measHeight ? String(rate.measHeight) : "",
      });
      setRegionRates(
        rate?.regions?.map((r) => ({ region: r.region, rate: String(r.rate) })) ?? []
      );
    }
  }, [open, rate, form]);

  function updateRegion(region: Region, value: string) {
    setRegionRates((prev) => {
      const exists = prev.some((r) => r.region === region);
      return exists
        ? prev.map((r) => (r.region === region ? { ...r, rate: value } : r))
        : [...prev, { region, rate: value }];
    });
  }

  async function onSubmit(values: RateValues) {
    try {
      const regionRatesPayload = regionRates
        .filter((r) => r.rate !== "")
        .map((r) => ({ region: r.region, rate: Number(r.rate) }));
      const payload = {
        label: values.label,
        calcUnit: values.calcUnit as RateUnit,
        calcWidth: values.calcWidth ? Number(values.calcWidth) : undefined,
        calcHeight: values.calcHeight ? Number(values.calcHeight) : undefined,
        measUnit: values.measUnit as RateUnit,
        measWidth: values.measWidth ? Number(values.measWidth) : undefined,
        measHeight: values.measHeight ? Number(values.measHeight) : undefined,
        regionRates: regionRatesPayload,
      } as CreateRateDto;
      if (rate) {
        await updateRate.mutateAsync({ id: rate.id, data: payload });
        toast.success("Rate updated");
      } else {
        await createRate.mutateAsync(payload);
        toast.success("Rate created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save rate");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rate ? "Edit Rate" : "Create Rate"}</DialogTitle>
          <DialogDescription>
            Admin master rate per region. Brands and vendors set their own rates separately.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Label</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Vinyl Flex 12ft" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calcUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calculation Unit</FormLabel>
                    <FormControl>
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {RATE_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {unitLabel(u)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="calcWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calc Width</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.0001" placeholder="W" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="calcHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calc Height</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.0001" placeholder="H" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="measUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurement Unit</FormLabel>
                    <FormControl>
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {RATE_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {unitLabel(u)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="measWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meas Width</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.0001" placeholder="W" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="measHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meas Height</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.0001" placeholder="H" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Admin Master Rate per Region</p>
              <div className="rounded-md border">
                {REGIONS.map((r) => {
                  const row = regionRates.find((x) => x.region === r);
                  return (
                    <div key={r} className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0">
                      <Label className="text-xs font-medium capitalize">{unitLabel(r)}</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-32"
                        placeholder="Rate (₹)"
                        value={row?.rate ?? ""}
                        onChange={(e) => updateRegion(r, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createRate.isPending || updateRate.isPending}>
                {rate ? "Save Changes" : "Create Rate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function QuoteCell({
  quotes,
  adminRates,
  partyLabel,
}: {
  quotes: RateQuoteDto[];
  adminRates: { region: Region; rate: string }[];
  partyLabel: "brand" | "vendor";
}) {
  if (quotes.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
  const byRegion = quotes.reduce<Record<string, RateQuoteDto[]>>((acc, q) => {
    (acc[q.region] ??= []).push(q);
    return acc;
  }, {});
  return (
    <div className="space-y-0.5">
      {Object.entries(byRegion).map(([region, qs]) => {
        const admin = adminRates.find((r) => r.region === region)?.rate
          ? Number(adminRates.find((r) => r.region === region)!.rate)
          : null;
        return (
          <div key={region} className="text-xs">
            <span className="text-muted-foreground">{unitLabel(region)}:</span>{" "}
            {qs.map((q, i) => {
              const val = Number(q.rate);
              const color =
                admin !== null && val < admin
                  ? "text-emerald-600"
                  : admin !== null && val > admin
                    ? "text-red-600"
                    : "text-foreground";
              return (
                <span key={i} className={`font-medium ${color}`}>
                  {q.brandName ?? q.vendorName ?? "—"}: ₹{Number(q.rate).toLocaleString("en-IN")}
                  {i < qs.length - 1 ? ", " : ""}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function DeleteRateDialog({ rate }: { rate: RateDto }) {
  const deleteRate = useDeleteRate();
  async function handleDelete() {
    try {
      await deleteRate.mutateAsync(rate.id);
      toast.success("Rate deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete rate");
    }
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete rate?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove "{rate.label}". Brand and vendor entries for it will be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={deleteRate.isPending}>
            {deleteRate.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RateActions({ rate }: { rate: RateDto }) {
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
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DeleteRateDialog rate={rate} />
        </DropdownMenuContent>
      </DropdownMenu>
      <RateFormDialog rate={rate} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

export function RatesOverview() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useRates(page);

  const columns: ColumnDef<RateDto>[] = [
    {
      accessorKey: "label",
      header: "Rate",
      cell: ({ row }) => {
        const calcSize =
          row.original.calcWidth || row.original.calcHeight
            ? `${row.original.calcWidth ?? "—"} x ${row.original.calcHeight ?? "—"}`
            : null;
        const measSize =
          row.original.measWidth || row.original.measHeight
            ? `${row.original.measWidth ?? "—"} x ${row.original.measHeight ?? "—"}`
            : null;
        return (
          <div>
            <p className="font-medium">{row.original.label}</p>
            <p className="text-muted-foreground text-xs">
              Calc: {unitLabel(row.original.calcUnit)}
              {calcSize ? ` (${calcSize})` : ""} · Meas: {unitLabel(row.original.measUnit)}
              {measSize ? ` (${measSize})` : ""}
            </p>
          </div>
        );
      },
    },
    {
      id: "admin",
      header: "Admin (all regions)",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          {row.original.regions.map((r) => (
            <div key={r.id} className="text-xs">
              <span className="text-muted-foreground">{unitLabel(r.region)}:</span>{" "}
              <span className="font-medium">₹{Number(r.rate).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "brand-quotes",
      header: "Brand quotes",
      cell: ({ row }) => (
        <QuoteCell
          quotes={row.original.brandQuotes ?? []}
          adminRates={row.original.regions}
          partyLabel="brand"
        />
      ),
    },
    {
      id: "vendor-quotes",
      header: "Vendor quotes",
      cell: ({ row }) => (
        <QuoteCell
          quotes={row.original.vendorQuotes ?? []}
          adminRates={row.original.regions}
          partyLabel="vendor"
        />
      ),
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
      id: "actions",
      cell: ({ row }) => <RateActions rate={row.original} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rate Catalog"
        description="Admin master rates per region — brands & vendors set their own rates"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Create Rate
              </Button>
            </DialogTrigger>
            <RateFormDialog open={createOpen} onOpenChange={setCreateOpen} />
          </Dialog>
        }
      />
      {isError ? (
        <ErrorState title="Failed to load rates" description="Could not fetch rate catalog." onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          totalRows={data?.meta.total ?? 0}
          pageIndex={page}
          pageSize={20}
          onPageChange={setPage}
          emptyTitle="No rates found"
          emptyDescription="Create your first rate to build the catalog."
        />
      )}
    </div>
  );
}