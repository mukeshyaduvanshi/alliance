"use client";

import * as React from "react";

import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@cj/ui";
import type { ErrorLogDto } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { useErrorLogs } from "@/features/system/queries";

const LEVELS = [
  { value: "ALL", label: "All" },
  { value: "ERROR", label: "Error" },
  { value: "WARNING", label: "Warning" },
  { value: "CRITICAL", label: "Critical" },
  { value: "INFO", label: "Info" },
];

function levelVariant(level: string) {
  switch (level) {
    case "CRITICAL":
      return "destructive";
    case "ERROR":
      return "destructive";
    case "WARNING":
      return "outline";
    default:
      return "secondary";
  }
}

export function ErrorLogs() {
  const [level, setLevel] = React.useState("ALL");
  const [selected, setSelected] = React.useState<ErrorLogDto | null>(null);
  const { data, isLoading, isError, refetch } = useErrorLogs(
    level === "ALL" ? undefined : level
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Error Logs"
        description="Application errors captured by the exception filter"
      />
      <Tabs
        value={level}
        onValueChange={setLevel}
      >
        <TabsList>
          {LEVELS.map((l) => (
            <TabsTrigger key={l.value} value={l.value}>
              {l.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {isError ? (
        <ErrorState
          title="Failed to load error logs"
          description="Could not fetch error logs."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : !data?.length ? (
        <div className="rounded-md border p-12 text-center text-muted-foreground text-sm">
          No error logs.
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelected(e)}
              className="flex w-full flex-col gap-1 rounded-md border p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{e.message}</span>
                <Badge variant={levelVariant(e.level) as "destructive" | "outline" | "secondary"}>
                  {e.level}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
                <span>{e.method ?? "—"} {e.path ?? ""}</span>
                <span>{formatDateTime(e.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.message}</DialogTitle>
            <DialogDescription>
              {selected?.level} · {formatDateTime(selected?.createdAt ?? "")} ·{" "}
              {selected?.method ?? "—"} {selected?.path ?? ""}
            </DialogDescription>
          </DialogHeader>
          <pre className="bg-muted max-h-[40vh] overflow-auto rounded-md p-4 text-xs">
            {selected?.stackTrace ?? "No stack trace available."}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
