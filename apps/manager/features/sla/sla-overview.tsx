"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  ErrorState,
  LoadingState,
  PageHeader,
  Skeleton,
} from "@cj/ui";
import type { SlaRuleDto } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import { useSlaRules, useSlaStatus } from "./queries";

const slaColumns: ColumnDef<SlaRuleDto>[] = [
  {
    accessorKey: "name",
    header: "Rule",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "appliesToStatus",
    header: "Applies To",
    cell: ({ row }) => <Badge variant="outline">{row.original.appliesToStatus}</Badge>,
  },
  {
    accessorKey: "thresholdHours",
    header: "Threshold",
    cell: ({ row }) => `${row.original.thresholdHours} hours`,
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
];

export function SlaOverview() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useSlaRules(page);
  const { data: breaches, isLoading: breachLoading, isError: breachError, refetch: refetchBreaches } = useSlaStatus();

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA Monitoring"
        description="Service-level agreements and breached orders"
      />

      <Card>
        <CardHeader>
          <CardTitle>Breached Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {breachError ? (
            <ErrorState title="Failed to load SLA status" description="Could not fetch breached orders." onRetry={() => refetchBreaches()} />
          ) : breachLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : breaches && breaches.length > 0 ? (
            <div className="space-y-2">
              {breaches.map(({ order, rule }, i) => (
                <div
                  key={`${order.id}-${i}`}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {order.orderNumber} · {order.brand?.brandName ?? "—"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Breached rule: {rule.name} ({rule.thresholdHours}h in {rule.appliesToStatus})
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-medium">{formatINR(order.totalAmount)}</span>
                    <Badge variant="destructive">{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No breached orders. All within SLA.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SLA Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <ErrorState title="Failed to load SLA rules" description="Could not fetch SLA rules." onRetry={() => refetch()} />
          ) : isLoading ? (
            <LoadingState rows={4} />
          ) : (
            <DataTable
              columns={slaColumns}
              data={data?.data ?? []}
              totalRows={data?.meta.total ?? 0}
              pageIndex={page}
              pageSize={20}
              onPageChange={setPage}
              emptyTitle="No SLA rules"
              emptyDescription="SLA rules configured by admins will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
