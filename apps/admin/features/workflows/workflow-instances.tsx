"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
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
  LoadingState,
  PageHeader,
  Textarea,
} from "@cj/ui";
import type { WorkflowInstanceDto } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import {
  useApproveInstance,
  usePendingWorkflows,
  useRejectInstance,
  useWorkflowInstances,
} from "./queries";

function DecisionDialog({
  instance,
  decision,
  open,
  onOpenChange,
}: {
  instance: WorkflowInstanceDto;
  decision: "APPROVE" | "REJECT";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [remarks, setRemarks] = React.useState("");
  const approve = useApproveInstance();
  const reject = useRejectInstance();
  const isApprove = decision === "APPROVE";

  async function handleSubmit() {
    try {
      if (isApprove) {
        await approve.mutateAsync({ id: instance.id, remarks: remarks || undefined });
        toast.success("Approved");
      } else {
        await reject.mutateAsync({ id: instance.id, remarks: remarks || undefined });
        toast.success("Rejected");
      }
      onOpenChange(false);
      setRemarks("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isApprove ? "Approve" : "Reject"} workflow instance</DialogTitle>
          <DialogDescription>
            {instance.workflowRule?.name ?? instance.entityType} — {instance.entityId}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Remarks (optional)</label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? "default" : "destructive"}
            onClick={handleSubmit}
            disabled={(approve.isPending || reject.isPending)}
          >
            {isApprove ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InstanceActions({ instance }: { instance: WorkflowInstanceDto }) {
  const [decision, setDecision] = React.useState<"APPROVE" | "REJECT" | null>(null);
  const isPending = instance.status === "PENDING";
  if (!isPending) return <Badge variant="secondary">{instance.status}</Badge>;
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon-sm" onClick={() => setDecision("APPROVE")}>
        <Check className="size-4 text-emerald-500" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => setDecision("REJECT")}>
        <X className="size-4 text-red-500" />
      </Button>
      {decision && (
        <DecisionDialog
          instance={instance}
          decision={decision}
          open={true}
          onOpenChange={(open) => !open && setDecision(null)}
        />
      )}
    </div>
  );
}

const columns: ColumnDef<WorkflowInstanceDto>[] = [
  {
    accessorKey: "entityType",
    header: "Entity",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.entityType}</p>
        <p className="text-muted-foreground text-xs">{row.original.entityId.slice(0, 8)}</p>
      </div>
    ),
  },
  {
    accessorKey: "workflowRule.name",
    header: "Workflow",
    cell: ({ row }) => row.original.workflowRule?.name ?? "—",
  },
  {
    accessorKey: "currentStepOrder",
    header: "Step",
    cell: ({ row }) => `Step ${row.original.currentStepOrder}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "PENDING" ? "outline" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Started",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    id: "actions",
    cell: ({ row }) => <InstanceActions instance={row.original} />,
  },
];

export function WorkflowInstances() {
  const [page, setPage] = React.useState(1);
  const instances = useWorkflowInstances(page);
  const pending = usePendingWorkflows();

  const data =
    pending.data && pending.data.length > 0
      ? pending.data
      : instances.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow Instances"
        description="In-flight approvals and history"
      />
      {instances.isError ? (
        <ErrorState title="Failed to load instances" description="Could not fetch workflow instances." onRetry={() => instances.refetch()} />
      ) : instances.isLoading || pending.isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          totalRows={instances.data?.meta.total ?? 0}
          pageIndex={page}
          pageSize={20}
          onPageChange={setPage}
          emptyTitle="No workflow instances"
          emptyDescription="Workflow instances will appear here."
        />
      )}
    </div>
  );
}
