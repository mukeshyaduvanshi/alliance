"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Check } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  DataTable,
  ErrorState,
  LoadingState,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@cj/ui";
import type { ExceptionAlertDto } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { usePermission } from "@/lib/permissions";

import { useAlerts, useResolveAlert } from "./queries";

const TAB_OPTIONS: { value: string; label: string; resolved?: boolean }[] = [
  { value: "OPEN", label: "Open", resolved: false },
  { value: "RESOLVED", label: "Resolved", resolved: true },
  { value: "ALL", label: "All" },
];

function ResolveButton({ alert }: { alert: ExceptionAlertDto }) {
  const canResolve = usePermission("alert", "EDIT");
  const resolveAlert = useResolveAlert();

  if (alert.isResolved || !canResolve) return null;

  async function handleResolve() {
    try {
      await resolveAlert.mutateAsync(alert.id);
      toast.success("Alert resolved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve alert");
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleResolve}>
      <Check className="size-4 text-emerald-500" />
      Resolve
    </Button>
  );
}

const columns: ColumnDef<ExceptionAlertDto>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.severity === "HIGH"
            ? "destructive"
            : row.original.severity === "MEDIUM"
              ? "outline"
              : "secondary"
        }
      >
        {row.original.severity}
      </Badge>
    ),
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => <span className="max-w-[280px] truncate">{row.original.message}</span>,
  },
  {
    accessorKey: "entityType",
    header: "Entity",
    cell: ({ row }) => (
      <div>
        <p className="text-sm">{row.original.entityType}</p>
        <p className="text-muted-foreground text-xs">{row.original.entityId.slice(0, 8)}</p>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    accessorKey: "isResolved",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isResolved ? "secondary" : "destructive"}>
        {row.original.isResolved ? "Resolved" : "Open"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ResolveButton alert={row.original} />,
  },
];

export function AlertsOverview() {
  const [tab, setTab] = React.useState("OPEN");
  const [page, setPage] = React.useState(1);
  const active = TAB_OPTIONS.find((t) => t.value === tab);
  const { data, isLoading, isError, refetch } = useAlerts(
    active?.resolved,
    page
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Exception alerts and SLA breaches"
      />
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          setPage(1);
        }}
      >
        <TabsList>
          {TAB_OPTIONS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {isError ? (
        <ErrorState
          title="Failed to load alerts"
          description="Could not fetch alerts."
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
          emptyTitle="No alerts"
          emptyDescription="Alerts will appear here when exceptions occur."
        />
      )}
    </div>
  );
}
