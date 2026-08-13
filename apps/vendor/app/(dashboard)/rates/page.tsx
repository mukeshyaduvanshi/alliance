"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@cj/ui";
import { Button } from "@cj/ui";
import { DataTable } from "@cj/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@cj/ui";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@cj/ui";
import { Input } from "@cj/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import type { VendorProductRateDto } from "@cj/types";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { useSelectRate, useSetVendorRate, useVendorMyRates, useVendorProducts } from "@/features/queries";

const rateSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  region: z.string().min(1, "Select a region"),
});

type RateValues = z.infer<typeof rateSchema>;

const columns: ColumnDef<VendorProductRateDto, unknown>[] = [
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
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.isActive ? (
        <Badge variant="success">Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      ),
  },
];

export default function VendorRatesPage() {
  const [page, setPage] = React.useState(1);
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"standard" | "custom">("standard");
  const [custom, setCustom] = React.useState("");
  const { data, isLoading, isError, refetch } = useVendorMyRates(page);
  const browse = useVendorProducts(1);
  const selectRate = useSelectRate();
  const setVendorRate = useSetVendorRate();

  const form = useForm<RateValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: { productId: "", region: "" },
  });

  const onSubmit = (values: RateValues) => {
    const common = {
      productId: values.productId,
      region: values.region,
    };
    const complete =
      mode === "custom"
        ? { ...common, isCustomRate: true, customRate: Number(custom) }
        : { ...common };

    const mutation =
      mode === "custom"
        ? {
            mutateAsync: setVendorRate.mutateAsync,
            isPending: setVendorRate.isPending,
          }
        : { mutateAsync: selectRate.mutateAsync, isPending: selectRate.isPending };

    mutation
      .mutateAsync(complete as never)
      .then(() => {
        toast.success("Rate added");
        setOpen(false);
        setCustom("");
        setMode("standard");
        form.reset({ productId: "", region: "" });
      })
      .catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : "Failed to add rate")
      );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rate Card"
        description="Your region-based rates per product"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" /> Add Rate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Rate</DialogTitle>
                <DialogDescription>
                  Select a product and choose your region rate.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <FormControl>
                          <Select value={field.value || undefined} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {(browse.data?.data ?? []).map((p) => (
                                <SelectItem key={p.id as string} value={p.id as string}>
                                  {p.name as string}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl>
                          <Select value={field.value || undefined} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                              {["PAN_INDIA", "NORTH_INDIA", "SOUTH_INDIA", "EAST_INDIA", "WEST_INDIA", "KERALA"].map(
                                (r) => (
                                  <SelectItem key={r} value={r}>
                                    {r.replace(/_/g, " ")}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={mode === "standard" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMode("standard")}
                    >
                      Standard rate
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "custom" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMode("custom")}
                    >
                      Custom rate
                    </Button>
                  </div>
                  {mode === "custom" && (
                    <div className="space-y-2">
                      <FormLabel htmlFor="custom-rate">Custom rate (₹)</FormLabel>
                      <Input
                        id="custom-rate"
                        type="number"
                        min={0}
                        placeholder="e.g. 450"
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                      />
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={
                        selectRate.isPending ||
                        setVendorRate.isPending ||
                        (mode === "custom" && !custom)
                      }
                    >
                      {selectRate.isPending || setVendorRate.isPending
                        ? "Saving…"
                        : "Add Rate"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {isError ? (
        <ErrorState
          title="Failed to load rate card"
          description="Could not fetch your rates."
          onRetry={() => refetch()}
        />
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
          emptyTitle="No rates configured"
          emptyDescription="Add a rate to start receiving assignments."
        />
      )}
    </div>
  );
}
