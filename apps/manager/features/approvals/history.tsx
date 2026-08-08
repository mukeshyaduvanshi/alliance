"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import {
  Badge,
  DataTable,
  ErrorState,
  LoadingState,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@cj/ui";
import type { WorkflowInstanceDto } from "@cj/types";
import { WorkflowInstanceStatus } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { useWorkflowHistory } from "./queries";

const STATUS_TABS: ("ALL" | WorkflowInstanceStatus)[] = [
  "ALL",
  WorkflowInstanceStatus.PENDING,
  WorkflowInstanceStatus.APPROVED,
  WorkflowInstanceStatus.REJECTED,
  WorkflowInstanceStatus.CANCELLED,
];

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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "REJECTED" ? "destructive" : row.original.status === "PENDING" ? "outline" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Started",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
];

export function ApprovalHistory() {
  const [status, setStatus] = React.useState<"ALL" | WorkflowInstanceStatus>("ALL");
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useWorkflowHistory(
    status === "ALL" ? undefined : status,
    page
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval History"
        description="All workflow instances and their outcomes"
      />
      <Tabs value={status} onValueChange={(v) => { setStatus(v as "ALL" | WorkflowInstanceStatus); setPage(1); }}>
        <TabsList>
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s === "ALL" ? "All" : s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {isError ? (
        <ErrorState
          title="Failed to load history"
          description="Could not fetch workflow instances."
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
          emptyTitle="No workflow instances"
          emptyDescription="Workflow instances will appear here."
        />
      )}
    </div>
  );
}
