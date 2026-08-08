"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUp, Check, X } from "lucide-react";

import {
  Badge,
  Button,
  DataTable,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@cj/ui";
import type { WorkflowInstanceDto } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { usePermission } from "@/lib/permissions";

import { DecisionDialog, type Decision } from "./approval-dialog";
import { usePendingWorkflows } from "./queries";

function InstanceActions({ instance }: { instance: WorkflowInstanceDto }) {
  const canApprove = usePermission("workflow", "APPROVE");
  const canReject = usePermission("workflow", "REJECT");
  const canEscalate = usePermission("workflow", "EDIT");
  const [decision, setDecision] = React.useState<Decision | null>(null);

  if (!canApprove && !canReject && !canEscalate) {
    return <Badge variant="secondary">{instance.status}</Badge>;
  }

  return (
    <div className="flex gap-1">
      {canApprove && (
        <Button
          variant="ghost"
          size="icon-sm"
          title="Approve"
          onClick={() => setDecision("APPROVE")}
        >
          <Check className="size-4 text-emerald-500" />
        </Button>
      )}
      {canReject && (
        <Button
          variant="ghost"
          size="icon-sm"
          title="Reject"
          onClick={() => setDecision("REJECT")}
        >
          <X className="size-4 text-red-500" />
        </Button>
      )}
      {canEscalate && (
        <Button
          variant="ghost"
          size="icon-sm"
          title="Escalate"
          onClick={() => setDecision("ESCALATE")}
        >
          <ArrowUp className="size-4 text-amber-500" />
        </Button>
      )}
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
        <p className="text-muted-foreground text-xs">
          {row.original.entityId.slice(0, 8)}
        </p>
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
    accessorKey: "createdAt",
    header: "Started",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    id: "actions",
    cell: ({ row }) => <InstanceActions instance={row.original} />,
  },
];

export function PendingApprovals() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = usePendingWorkflows(page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approvals"
        description="Workflow instances awaiting your approval"
      />
      {isError ? (
        <ErrorState
          title="Failed to load approvals"
          description="Could not fetch pending approvals."
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
          emptyTitle="No pending approvals"
          emptyDescription="Workflow instances awaiting your approval will appear here."
        />
      )}
    </div>
  );
}
