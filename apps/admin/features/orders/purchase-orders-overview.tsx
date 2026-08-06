"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  DialogTrigger,
  ErrorState,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cj/ui";
import type { PurchaseOrderDto } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import {
  useBrandsForOrders,
  useCreatePurchaseOrder,
  usePurchaseOrders,
  useTogglePoStatus,
} from "./queries";

const poSchema = z.object({
  poNumber: z.string().min(1, "PO number required"),
  totalBudget: z.coerce.number().min(1, "Budget must be at least 1"),
});

type PoValues = z.infer<typeof poSchema>;

function CreatePoDialog() {
  const [open, setOpen] = React.useState(false);
  const { data: brands } = useBrandsForOrders();
  const createPo = useCreatePurchaseOrder();
  const [brandId, setBrandId] = React.useState("");

  const form = useForm<PoValues>({
    resolver: zodResolver(poSchema),
    defaultValues: { poNumber: "", totalBudget: 0 },
  });

  async function onSubmit(values: PoValues) {
    if (!brandId) {
      toast.error("Please select a brand");
      return;
    }
    try {
      await createPo.mutateAsync({
        brandId,
        data: { poNumber: values.poNumber, totalBudget: values.totalBudget },
      });
      toast.success("Purchase order created");
      setOpen(false);
      form.reset();
      setBrandId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create PO");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Purchase Order</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Create a PO with a budget for a brand.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="poNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PO Number</FormLabel>
                  <FormControl>
                    <Input placeholder="PO-2026-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Budget (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Brand</label>
              <Select value={brandId || undefined} onValueChange={setBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands?.data?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.brandName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createPo.isPending}>
                {createPo.isPending ? "Creating..." : "Create PO"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PoActions({ po }: { po: PurchaseOrderDto }) {
  const toggleStatus = useTogglePoStatus();
  async function handleToggle() {
    try {
      await toggleStatus.mutateAsync({ id: po.id, isActive: !po.isActive });
      toast.success(po.isActive ? "PO deactivated" : "PO activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update PO");
    }
  }
  const pct = po.totalBudget
    ? Math.min(100, (Number(po.consumedAmount) / Number(po.totalBudget)) * 100)
    : 0;
  return (
    <div className="flex items-center justify-end gap-3">
      <div className="w-24">
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={handleToggle} disabled={toggleStatus.isPending}>
        {po.isActive ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}

const columns: ColumnDef<PurchaseOrderDto>[] = [
  {
    accessorKey: "poNumber",
    header: "PO Number",
    cell: ({ row }) => <span className="font-medium">{row.original.poNumber}</span>,
  },
  {
    accessorKey: "brand.brandName",
    header: "Brand",
    cell: ({ row }) => row.original.brand?.brandName ?? "—",
  },
  {
    accessorKey: "totalBudget",
    header: "Budget",
    cell: ({ row }) => formatINR(row.original.totalBudget),
  },
  {
    accessorKey: "consumedAmount",
    header: "Consumed",
    cell: ({ row }) => formatINR(row.original.consumedAmount),
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
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    id: "actions",
    cell: ({ row }) => <PoActions po={row.original} />,
  },
];

export function PurchaseOrdersOverview() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = usePurchaseOrders(undefined, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage purchase orders and budgets"
        actions={<CreatePoDialog />}
      />
      {isError ? (
        <ErrorState title="Failed to load purchase orders" description="Could not fetch POs from the server." onRetry={() => refetch()} />
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
          emptyTitle="No purchase orders found"
          emptyDescription="Create your first purchase order."
        />
      )}
    </div>
  );
}
