"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";

import {
  Badge,
  Button,
  DataTable,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cj/ui";
import type { AuditLogDto } from "@cj/types";
import { ActorType, AuditAction } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { auditLogExportUrl, useAuditLogs } from "./queries";

const ACTOR_OPTIONS = Object.values(ActorType);
const ACTION_OPTIONS = Object.values(AuditAction);

const columns: ColumnDef<AuditLogDto>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    accessorKey: "actorType",
    header: "Actor",
    cell: ({ row }) => (
      <div>
        <Badge variant="outline">{row.original.actorType}</Badge>
        {row.original.actorName && (
          <p className="text-muted-foreground mt-0.5 text-xs">{row.original.actorName}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => <Badge variant="secondary">{row.original.action}</Badge>,
  },
  {
    accessorKey: "module",
    header: "Module",
    cell: ({ row }) => <span className="font-medium">{row.original.module}</span>,
  },
  {
    accessorKey: "entityType",
    header: "Entity",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.entityType ?? "—"}
        {row.original.entityId ? ` · ${row.original.entityId.slice(0, 8)}` : ""}
      </span>
    ),
  },
];

export function AuditLogsOverview() {
  const [page, setPage] = React.useState(1);
  const [module, setModule] = React.useState("");
  const [action, setAction] = React.useState("");
  const [actorType, setActorType] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const PAGE_SIZE = 20;

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [module, action, actorType, debouncedSearch]);

  const query = {
    page,
    pageSize: PAGE_SIZE,
    module: module || undefined,
    action: (action as AuditAction) || undefined,
    actorType: (actorType as ActorType) || undefined,
    search: debouncedSearch || undefined,
  };

  const { data, isLoading, isError, refetch } = useAuditLogs(query);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all platform activity"
        actions={
          <Button
            variant="outline"
            asChild
          >
            <a
              href={auditLogExportUrl(query)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="size-4" />
              Export CSV
            </a>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-56"
          placeholder="Search actor/module..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={module || undefined} onValueChange={setModule}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            {["auth", "user", "role", "brand", "vendor", "order", "product", "audit_log", "workflow", "monitoring"].map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action || undefined} onValueChange={setAction}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actorType || undefined} onValueChange={setActorType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Actor Type" />
          </SelectTrigger>
          <SelectContent>
            {ACTOR_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState title="Failed to load audit logs" description="Could not fetch audit logs from the server." onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={5} />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            emptyTitle="No audit logs found"
            emptyDescription="No activity matching these filters."
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {data?.page ?? 1} of {totalPages} · {data?.total ?? 0} records
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
