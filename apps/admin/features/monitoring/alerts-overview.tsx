"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

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
  ErrorState,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cj/ui";
import type { ExceptionAlertDto } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { useAlerts, useResolveAlert } from "./queries";

function severityVariant(severity: string) {
  if (severity === "HIGH") return "destructive";
  if (severity === "MEDIUM") return "default";
  return "secondary";
}

function ResolveDialog({ alert }: { alert: ExceptionAlertDto }) {
  const resolveAlert = useResolveAlert();
  async function handleResolve() {
    try {
      await resolveAlert.mutateAsync(alert.id);
      toast.success("Alert resolved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve alert");
    }
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={alert.isResolved}>
          {alert.isResolved ? "Resolved" : "Resolve"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve alert?</AlertDialogTitle>
          <AlertDialogDescription>
            Mark this alert as resolved: {alert.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleResolve} disabled={resolveAlert.isPending}>
            {resolveAlert.isPending ? "Resolving..." : "Resolve"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function buildColumns(showResolved: boolean): ColumnDef<ExceptionAlertDto>[] {
  return [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => (
        <Badge variant={severityVariant(row.original.severity)}>
          {row.original.severity}
        </Badge>
      ),
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => <span className="max-w-[300px] truncate">{row.original.message}</span>,
    },
    {
      accessorKey: "entityType",
      header: "Entity",
      cell: ({ row }) => (
        <span>
          {row.original.entityType} · {row.original.entityId.slice(0, 8)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    ...(showResolved
      ? [
          {
            accessorKey: "isResolved",
            header: "Status",
            cell: ({ row }: { row: { original: ExceptionAlertDto } }) => (
              <Badge variant={row.original.isResolved ? "default" : "outline"}>
                {row.original.isResolved ? "Resolved" : "Open"}
              </Badge>
            ),
          } as ColumnDef<ExceptionAlertDto>,
        ]
      : []),
    {
      id: "actions",
      cell: ({ row }: { row: { original: ExceptionAlertDto } }) => (
        <ResolveDialog alert={row.original} />
      ),
    },
  ];
}

export function AlertsOverview() {
  const [filter, setFilter] = React.useState<"all" | "open" | "resolved">("all");
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useAlerts(
    filter === "all" ? undefined : filter === "resolved",
    page
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exception Alerts"
        description="Monitor and resolve platform alerts"
        actions={
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v as typeof filter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      {isError ? (
        <ErrorState title="Failed to load alerts" description="Could not fetch alerts from the server." onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <DataTable
          columns={buildColumns(filter !== "open")}
          data={data?.data ?? []}
          totalRows={data?.meta.total ?? 0}
          pageIndex={page}
          pageSize={20}
          onPageChange={setPage}
          emptyTitle="No alerts found"
          emptyDescription="No exception alerts matching this filter."
        />
      )}
    </div>
  );
}
