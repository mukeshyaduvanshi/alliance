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
import type { CreateSlaRuleDto, SlaRuleDto } from "@cj/types";
import { OrderStatus } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { useCreateSlaRule, useSlaRules } from "./queries";

const STATUS_OPTIONS = Object.values(OrderStatus);

const slaSchema = z.object({
  name: z.string().min(2, "Name required"),
  appliesToStatus: z.string().min(1, "Status required"),
  thresholdHours: z.coerce.number().min(1, "At least 1 hour"),
});

type SlaValues = z.infer<typeof slaSchema>;

function CreateSlaRuleDialog() {
  const [open, setOpen] = React.useState(false);
  const createSlaRule = useCreateSlaRule();

  const form = useForm<SlaValues>({
    resolver: zodResolver(slaSchema),
    defaultValues: { name: "", appliesToStatus: "", thresholdHours: 24 },
  });

  async function onSubmit(values: SlaValues) {
    try {
      await createSlaRule.mutateAsync({
        name: values.name,
        appliesToStatus: values.appliesToStatus,
        thresholdHours: values.thresholdHours,
      } as CreateSlaRuleDto);
      toast.success("SLA rule created");
      setOpen(false);
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create SLA rule");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create SLA Rule</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create SLA Rule</DialogTitle>
          <DialogDescription>
            Set a response threshold for an order status.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Production SLA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="appliesToStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applies To Status</FormLabel>
                  <FormControl>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
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
              name="thresholdHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Threshold (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createSlaRule.isPending}>
                {createSlaRule.isPending ? "Creating..." : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const columns: ColumnDef<SlaRuleDto>[] = [
  {
    accessorKey: "name",
    header: "Rule",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "appliesToStatus",
    header: "Status",
    cell: ({ row }) => <Badge variant="outline">{row.original.appliesToStatus}</Badge>,
  },
  {
    accessorKey: "thresholdHours",
    header: "Threshold",
    cell: ({ row }) => `${row.original.thresholdHours} hrs`,
  },
  {
    accessorKey: "isActive",
    header: "Active",
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
];

export function SlaRulesOverview() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useSlaRules(page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA Rules"
        description="Configure response thresholds per order status"
        actions={<CreateSlaRuleDialog />}
      />
      {isError ? (
        <ErrorState title="Failed to load SLA rules" description="Could not fetch SLA rules from the server." onRetry={() => refetch()} />
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
          emptyTitle="No SLA rules found"
          emptyDescription="Create your first SLA rule."
        />
      )}
    </div>
  );
}
