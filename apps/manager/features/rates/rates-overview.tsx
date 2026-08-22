"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
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
  Card,
  CardContent,
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
import type { CreateRateDto, RateDto, RateUnit, Region } from "@cj/types";
import { RateUnit as RateUnitEnum, Region as RegionEnum } from "@cj/types";

import { usePermission } from "@/lib/permissions";
import { useCreateRate, useDeleteRate, useRates, useUpdateRate } from "./queries";

const REGIONS = Object.values(RegionEnum);
const RATE_UNITS = Object.values(RateUnitEnum);
const unitLabel = (u: RateUnit | string) => (u ? u.replace(/_/g, " ").toLowerCase() : "");

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
    defaultValues: {
      label: "",
      calcUnit: "",
      calcWidth: "",
      calcHeight: "",
      measUnit: "",
      measWidth: "",
      measHeight: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        label: rate?.label ?? "",
        calcUnit: rate?.calcUnit ?? "",
        calcWidth: rate?.calcWidth != null ? String(Number(rate.calcWidth)) : "",
        calcHeight: rate?.calcHeight != null ? String(Number(rate.calcHeight)) : "",
        measUnit: rate?.measUnit ?? "",
        measWidth: rate?.measWidth != null ? String(Number(rate.measWidth)) : "",
        measHeight: rate?.measHeight != null ? String(Number(rate.measHeight)) : "",
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
            Master rate per region.
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
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
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
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
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
              <p className="mb-2 text-sm font-medium">Master Rate per Region</p>
              <div className="rounded-md border">
                {REGIONS.map((r) => {
                  const row = regionRates.find((x) => x.region === r);
                  return (
                    <div key={r} className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0">
                      <Label className="text-xs font-medium">{unitLabel(r)}</Label>
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
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(e) => e.preventDefault()}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete rate?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove "{rate.label}".
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

function RateActions({ rate }: { rate: RateDto }) {
  const canEdit = usePermission("rate", "EDIT");
  const canDelete = usePermission("rate", "DELETE");
  const [editOpen, setEditOpen] = React.useState(false);

  if (!canEdit && !canDelete) return null;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && (
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
          )}
          {canEdit && canDelete && <DropdownMenuSeparator />}
          {canDelete && <DeleteRateDialog rate={rate} />}
        </DropdownMenuContent>
      </DropdownMenu>
      {canEdit && <RateFormDialog rate={rate} open={editOpen} onOpenChange={setEditOpen} />}
    </div>
  );
}

export function RatesOverview() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useRates(page);

  const canCreate = usePermission("rate", "CREATE");

  const ratesList = data?.data ?? [];
  const totalPages = data?.meta?.total ? Math.ceil(data.meta.total / 20) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rate Catalog"
        description="Master rates per region"
        actions={
          canCreate ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" />
                  Create Rate
                </Button>
              </DialogTrigger>
              <RateFormDialog open={createOpen} onOpenChange={setCreateOpen} />
            </Dialog>
          ) : undefined
        }
      />

      {isError ? (
        <ErrorState
          title="Failed to load rates"
          description="Could not fetch rate catalog."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : ratesList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground font-medium">No master rates found</p>
            <p className="text-muted-foreground text-xs">
              Rate catalog is empty.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Accordion type="multiple" className="space-y-3">
            {ratesList.map((rateItem) => {
              const fmtNum = (val: string | number | null | undefined) =>
                val != null && val !== "" ? String(Number(val)) : "—";
              const panRate = rateItem.regions?.find((r) => r.region === "PAN_INDIA") ?? rateItem.regions?.[0];
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

                    <div className="flex items-center gap-4 mr-2" onClick={(e) => e.stopPropagation()}>
                      {panRate ? (
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-muted-foreground block">
                            {unitLabel(panRate.region)} (master)
                          </span>
                          <span className="text-lg font-bold text-emerald-600">
                            ₹{Number(panRate.rate).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-1">
                            / {unitLabel(rateItem.calcUnit)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No rate set</span>
                      )}

                      <RateActions rate={rateItem} />
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-2 pb-3 border-t mt-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                        All Region Master Rates
                      </p>
                      {rateItem.regions && rateItem.regions.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
                          {rateItem.regions.map((r) => (
                            <div
                              key={r.id}
                              className="flex flex-col rounded-md border bg-muted/40 p-2.5 text-center transition-colors hover:bg-muted/70"
                            >
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {unitLabel(r.region)}
                              </span>
                              <span className="text-base font-bold text-foreground mt-1">
                                ₹{Number(r.rate).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                per {unitLabel(rateItem.calcUnit)}
                              </span>
                            </div>
                          ))}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
