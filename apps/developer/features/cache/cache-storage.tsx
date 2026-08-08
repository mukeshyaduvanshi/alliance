"use client";

import * as React from "react";
import { Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
} from "@cj/ui";

import { usePermission } from "@/lib/permissions";

import { useCacheKeys, useDeleteCacheKey, useFlushCache } from "@/features/system/queries";

export function CacheStorage() {
  const [pattern, setPattern] = React.useState("*");
  const { data, isLoading, isError, refetch } = useCacheKeys(pattern);
  const deleteKey = useDeleteCacheKey();
  const flushCache = useFlushCache();
  const canDelete = usePermission("system_admin", "DELETE");

  async function handleDelete(key: string) {
    try {
      await deleteKey.mutateAsync(key);
      toast.success("Cache key deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete key");
    }
  }

  async function handleFlush() {
    if (!window.confirm("Flush ALL cache keys? This cannot be undone.")) return;
    try {
      await flushCache.mutateAsync();
      toast.success("Cache flushed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to flush cache");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cache & Storage"
        description="Redis cache key management"
        actions={
          canDelete && (
            <Button variant="destructive" onClick={handleFlush} disabled={flushCache.isPending}>
              <XCircle className="size-4" />
              Flush All
            </Button>
          )
        }
      />

      <div className="flex max-w-sm items-center gap-2">
        <Input
          value={pattern}
          onChange={(e) => setPattern(e.target.value || "*")}
          placeholder="Pattern e.g. *session*"
        />
        <Button variant="outline" onClick={() => refetch()}>
          Search
        </Button>
      </div>

      {isError ? (
        <ErrorState title="Failed to load cache keys" description="Could not fetch cache keys." onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : !data?.length ? (
        <div className="rounded-md border p-12 text-center text-muted-foreground text-sm">
          No cache keys found for pattern &quot;{pattern}&quot;.
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((key) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="flex min-w-0 items-center gap-2">
                <Badge variant="outline">{key}</Badge>
              </div>
              {canDelete && (
                <Button variant="ghost" size="icon-sm" title="Delete key" onClick={() => handleDelete(key)}>
                  <Trash2 className="size-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
          {data.length >= 100 && (
            <p className="text-muted-foreground text-center text-xs">
              Showing first 100 keys. Use a pattern to narrow down.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
