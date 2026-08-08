"use client";

import * as React from "react";

import {
  Badge,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@cj/ui";
import { formatDateTime } from "@cj/utils";

import { useEmailLogs, useSmsLogs } from "@/features/system/queries";

function statusVariant(status: string) {
  if (status === "SEND" || status === "SENT") return "default";
  if (status === "FAILED") return "destructive";
  return "outline";
}

export function EmailLogs() {
  const { data, isLoading, isError, refetch } = useEmailLogs();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Logs"
        description="Email delivery records"
      />
      {isError ? (
        <ErrorState title="Failed to load email logs" description="Could not fetch email logs." onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : !data?.length ? (
        <div className="rounded-md border p-12 text-center text-muted-foreground text-sm">
          No email logs yet.
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 rounded-md border p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{e.subject}</p>
                <p className="text-muted-foreground text-xs">
                  To: {e.toAddress} · {formatDateTime(e.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {e.errorMessage && (
                  <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                    {e.errorMessage}
                  </span>
                )}
                <Badge variant={statusVariant(e.status) as "default" | "destructive" | "outline"}>
                  {e.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SmsLogs() {
  const { data, isLoading, isError, refetch } = useSmsLogs();

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS Logs"
        description="SMS delivery records"
      />
      {isError ? (
        <ErrorState title="Failed to load SMS logs" description="Could not fetch SMS logs." onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : !data?.length ? (
        <div className="rounded-md border p-12 text-center text-muted-foreground text-sm">
          No SMS logs yet.
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.message}</p>
                <p className="text-muted-foreground text-xs">
                  To: {s.toPhone} · {formatDateTime(s.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {s.errorMessage && (
                  <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                    {s.errorMessage}
                  </span>
                )}
                <Badge variant={statusVariant(s.status) as "default" | "destructive" | "outline"}>
                  {s.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
