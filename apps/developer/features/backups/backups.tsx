"use client";

import * as React from "react";
import { DatabaseBackup } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorState,
  Input,
  Label,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cj/ui";
import { formatDateTime } from "@cj/utils";

import { usePermission } from "@/lib/permissions";

import { useBackups, useLogBackup } from "@/features/system/queries";

function statusVariant(status: string) {
  if (status === "SUCCESS") return "default";
  if (status === "FAILED") return "destructive";
  return "outline";
}

function TriggerBackupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const logBackup = useLogBackup();
  const [status, setStatus] = React.useState("IN_PROGRESS");
  const [fileSize, setFileSize] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  async function handleSubmit() {
    try {
      await logBackup.mutateAsync({
        status,
        fileSizeMb: fileSize ? Number(fileSize) : undefined,
        errorMessage: errorMessage || undefined,
      });
      toast.success("Backup logged");
      setFileSize("");
      setErrorMessage("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log backup");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Backup</DialogTitle>
          <DialogDescription>
            Record a backup run and its outcome.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fileSize">File Size (MB, optional)</Label>
            <Input
              id="fileSize"
              type="number"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
              placeholder="e.g. 128"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="error">Error Message (optional)</Label>
            <Input
              id="error"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="backup failed: connection timeout"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={logBackup.isPending}>
            {logBackup.isPending ? "Logging..." : "Log Backup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Backups() {
  const [open, setOpen] = React.useState(false);
  const canCreate = usePermission("system_admin", "CREATE");
  const { data, isLoading, isError, refetch } = useBackups();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backups"
        description="Backup history and status"
        actions={
          canCreate && (
            <Button onClick={() => setOpen(true)}>
              <DatabaseBackup className="size-4" />
              Log Backup
            </Button>
          )
        }
      />
      {open && (
        <TriggerBackupDialog open={open} onOpenChange={setOpen} />
      )}
      {isError ? (
        <ErrorState title="Failed to load backups" description="Could not fetch backups." onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : !data?.length ? (
        <div className="rounded-md border p-12 text-center text-muted-foreground text-sm">
          No backups yet.
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 rounded-md border p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {formatDateTime(b.startedAt)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {b.fileSizeMb != null ? `${b.fileSizeMb} MB` : "size unknown"}
                  {b.completedAt ? ` · completed ${formatDateTime(b.completedAt)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {b.errorMessage && (
                  <span className="text-muted-foreground max-w-[240px] truncate text-xs">
                    {b.errorMessage}
                  </span>
                )}
                <Badge variant={statusVariant(b.status) as "default" | "destructive" | "outline"}>
                  {b.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
