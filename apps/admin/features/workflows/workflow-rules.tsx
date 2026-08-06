"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
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
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@cj/ui";
import type { CreateWorkflowRuleDto, WorkflowRuleDto } from "@cj/types";

import { useRoles } from "@/features/users/queries";

import {
  useCreateWorkflow,
  useDeleteWorkflow,
  useUpdateWorkflow,
  useWorkflows,
} from "./queries";

const MODULES = ["brand_onboarding", "brand_order", "vendor_onboarding", "purchase_order"];

const ruleSchema = z.object({
  name: z.string().min(2, "Name required"),
  module: z.string().min(1, "Module required"),
  description: z.string().optional(),
  autoApprove: z.boolean(),
  escalationHours: z.coerce.number().min(0).optional(),
});

type RuleValues = z.infer<typeof ruleSchema>;

const emptyStep = { stepOrder: 1, approverRoleId: "", escalationRoleId: "", isOptional: false };

function WorkflowRuleForm({
  rule,
  open,
  onOpenChange,
}: {
  rule?: WorkflowRuleDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: roles } = useRoles();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();

  const [steps, setSteps] = React.useState<
    { stepOrder: number; approverRoleId: string; escalationRoleId: string; isOptional: boolean }[]
  >([]);

  const form = useForm<RuleValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "",
      module: "",
      description: "",
      autoApprove: false,
      escalationHours: 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: rule?.name ?? "",
        module: rule?.module ?? "",
        description: rule?.description ?? "",
        autoApprove: rule?.autoApprove ?? false,
        escalationHours: rule?.escalationHours ?? 0,
      });
      setSteps(
        rule?.steps?.map((s) => ({
          stepOrder: s.stepOrder,
          approverRoleId: s.approverRoleId,
          escalationRoleId: s.escalationRoleId ?? "",
          isOptional: s.isOptional,
        })) ?? [{ ...emptyStep }]
      );
    }
  }, [open, rule, form]);

  function updateStep(index: number, patch: Partial<(typeof steps)[number]>) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch, stepOrder: i + 1 } : s))
    );
  }

  function addStep() {
    setSteps((prev) => [
      ...prev.map((s, i) => ({ ...s, stepOrder: i + 1 })),
      { ...emptyStep, stepOrder: prev.length + 1 },
    ]);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i + 1 })));
  }

  async function onSubmit(values: RuleValues) {
    try {
      const base = {
        name: values.name,
        module: values.module,
        description: values.description || undefined,
        autoApprove: values.autoApprove,
        escalationHours: values.escalationHours,
      };
      if (rule) {
        await updateWorkflow.mutateAsync({ id: rule.id, data: base });
        toast.success("Workflow rule updated");
      } else {
        const validSteps = steps.filter((s) => s.approverRoleId);
        await createWorkflow.mutateAsync({
          ...base,
          steps: validSteps.map((s) => ({
            stepOrder: s.stepOrder,
            approverRoleId: s.approverRoleId,
            escalationRoleId: s.escalationRoleId || undefined,
            isOptional: s.isOptional,
          })),
        } as CreateWorkflowRuleDto);
        toast.success("Workflow rule created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save workflow");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Workflow Rule" : "Create Workflow Rule"}</DialogTitle>
          <DialogDescription>
            Configure the approval flow and its steps.
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
                    <Input placeholder="Brand Order Approval" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="module"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Module</FormLabel>
                  <FormControl>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODULES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="What is this flow for?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="autoApprove"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-approve</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="escalationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escalation Hours</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Approval Steps</h3>
                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                  <Plus className="size-3" />
                  Add Step
                </Button>
              </div>
              {steps.map((step, index) => (
                <div key={index} className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Step {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <Select
                    value={step.approverRoleId || undefined}
                    onValueChange={(v) => updateStep(index, { approverRoleId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Approver role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.data?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={step.escalationRoleId || undefined}
                    onValueChange={(v) => updateStep(index, { escalationRoleId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escalation role (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.data?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={step.isOptional}
                      onChange={(e) => updateStep(index, { isOptional: e.target.checked })}
                    />
                    Optional step
                  </label>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createWorkflow.isPending || updateWorkflow.isPending}>
                {rule ? "Save Changes" : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteWorkflowDialog({ workflow }: { workflow: WorkflowRuleDto }) {
  const deleteWorkflow = useDeleteWorkflow();
  async function handleDelete() {
    try {
      await deleteWorkflow.mutateAsync(workflow.id);
      toast.success("Workflow deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete workflow");
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
          <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete "{workflow.name}". This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={deleteWorkflow.isPending}>
            {deleteWorkflow.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function WorkflowActions({ workflow }: { workflow: WorkflowRuleDto }) {
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
          <DeleteWorkflowDialog workflow={workflow} />
        </DropdownMenuContent>
      </DropdownMenu>
      <WorkflowRuleForm rule={workflow} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

const columns: ColumnDef<WorkflowRuleDto>[] = [
  {
    accessorKey: "name",
    header: "Rule",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        {row.original.description && (
          <p className="text-muted-foreground text-xs">{row.original.description}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "module",
    header: "Module",
    cell: ({ row }) => <Badge variant="outline">{row.original.module}</Badge>,
  },
  {
    accessorKey: "steps",
    header: "Steps",
    cell: ({ row }) => row.original.steps?.length ?? 0,
  },
  {
    accessorKey: "autoApprove",
    header: "Auto Approve",
    cell: ({ row }) => (row.original.autoApprove ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge>),
  },
  {
    accessorKey: "escalationHours",
    header: "Escalation (hrs)",
    cell: ({ row }) => row.original.escalationHours ?? "—",
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
    cell: ({ row }) => <WorkflowActions workflow={row.original} />,
  },
];

export function WorkflowRules() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useWorkflows(page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow Rules"
        description="Configure approval workflows per module"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create Rule
          </Button>
        }
      />
      {isError ? (
        <ErrorState title="Failed to load workflows" description="Could not fetch workflows from the server." onRetry={() => refetch()} />
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
          emptyTitle="No workflow rules found"
          emptyDescription="Create your first approval workflow."
        />
      )}
      <WorkflowRuleForm open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
