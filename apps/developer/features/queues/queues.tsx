"use client";

import * as React from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  CardContent,
  ErrorState,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@cj/ui";
import type { QueueJobDto, QueueJobStatus } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { usePermission } from "@/lib/permissions";

import {
  useQueueJobs,
  useQueues,
  useRemoveJob,
  useRetryJob,
} from "@/features/system/queries";

const JOB_STATUSES: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "waiting", label: "Waiting" },
  { value: "active", label: "Active" },
  { value: "failed", label: "Failed" },
  { value: "completed", label: "Completed" },
  { value: "delayed", label: "Delayed" },
];

function JobRow({ job, queueName }: { job: QueueJobDto; queueName: string }) {
  const canRetry = usePermission("system_admin", "EDIT");
  const canDelete = usePermission("system_admin", "DELETE");
  const retry = useRetryJob();
  const remove = useRemoveJob();

  async function handleRetry() {
    try {
      await retry.mutateAsync({ name: queueName, id: job.id });
      toast.success("Job requeued");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to retry job");
    }
  }

  async function handleRemove() {
    try {
      await remove.mutateAsync({ name: queueName, id: job.id });
      toast.success("Job removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove job");
    }
  }

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {job.name} <span className="text-muted-foreground">#{job.id}</span>
          </p>
          <p className="text-muted-foreground text-xs">
            attempts: {job.attemptsMade} · created: {job.timestamp ? formatDateTime(new Date(job.timestamp).toISOString()) : "—"}
            {job.finishedOn ? ` · finished: ${formatDateTime(new Date(job.finishedOn).toISOString())}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant={
              job.status === "failed"
                ? "destructive"
                : job.status === "completed"
                  ? "secondary"
                  : "outline"
            }
          >
            {job.status}
          </Badge>
          {canRetry && job.status === "failed" && (
            <Button variant="ghost" size="icon-sm" title="Retry" onClick={handleRetry}>
              <RotateCcw className="size-4 text-amber-500" />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon-sm" title="Remove" onClick={handleRemove}>
              <Trash2 className="size-4 text-red-500" />
            </Button>
          )}
        </div>
      </div>
      {job.failedReason && (
        <p className="bg-muted mt-2 rounded p-2 text-xs text-destructive">
          {job.failedReason}
        </p>
      )}
      {Object.keys(job.data ?? {}).length > 0 && (
        <pre className="bg-muted mt-2 max-h-24 overflow-auto rounded p-2 text-xs">
          {JSON.stringify(job.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function QueuesOverview() {
  const [queueName, setQueueName] = React.useState<string>("");
  const [status, setStatus] = React.useState("ALL");
  const [page, setPage] = React.useState(1);

  const { data: queues, isLoading, isError, refetch } = useQueues();
  const selectedQueue = queueName || queues?.[0]?.name || "";
  const {
    data: jobs,
    isLoading: jobsLoading,
    isError: jobsError,
    refetch: refetchJobs,
  } = useQueueJobs(selectedQueue, status === "ALL" ? undefined : (status as QueueJobStatus), page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Queues & Jobs"
        description="BullMQ queue monitoring and job management"
      />
      {isError ? (
        <ErrorState title="Failed to load queues" description="Could not fetch queues." onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {queues?.map((q) => (
              <button
                key={q.name}
                onClick={() => {
                  setQueueName(q.name);
                  setPage(1);
                }}
                className={`text-left transition-colors ${q.name === selectedQueue ? "" : "opacity-70 hover:opacity-100"}`}
              >
                <Card className={q.name === selectedQueue ? "border-primary" : ""}>
                  <CardContent className="space-y-2 py-4">
                    <p className="text-sm font-medium capitalize">{q.name}</p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <Badge variant="outline">{q.waiting} waiting</Badge>
                      <Badge variant="outline">{q.active} active</Badge>
                      <Badge variant={q.failed > 0 ? "destructive" : "outline"}>
                        {q.failed} failed
                      </Badge>
                      <Badge variant="secondary">{q.completed} done</Badge>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Select value={selectedQueue} onValueChange={(v) => { setQueueName(v); setPage(1); }}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {queues?.map((q) => (
                    <SelectItem key={q.name} value={q.name}>
                      {q.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <TabsList>
                  {JOB_STATUSES.map((s) => (
                    <TabsTrigger key={s.value} value={s.value}>
                      {s.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {jobsError ? (
              <ErrorState title="Failed to load jobs" description="Could not fetch queue jobs." onRetry={() => refetchJobs()} />
            ) : jobsLoading ? (
              <LoadingState rows={4} />
            ) : jobs && jobs.data.length > 0 ? (
              <div className="space-y-2">
                {jobs.data.map((job) => (
                  <JobRow key={`${job.id}-${job.name}`} job={job} queueName={selectedQueue} />
                ))}
              </div>
            ) : (
              <div className="rounded-md border p-12 text-center text-muted-foreground text-sm">
                No jobs in this queue.
              </div>
            )}

            {jobs && jobs.total > 0 && jobs.data.length < jobs.total && (
              <div className="pt-2 text-center">
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)}>
                  Load more ({jobs.data.length}/{jobs.total})
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
