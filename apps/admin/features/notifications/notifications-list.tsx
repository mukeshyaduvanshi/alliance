"use client";

import * as React from "react";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  ErrorState,
  LoadingState,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@cj/ui";
import { formatDateTime } from "@cj/utils";

import { useMarkAllRead, useMarkRead, useNotifications } from "./queries";

const TABS = [
  { value: "ALL", label: "All" },
  { value: "UNREAD", label: "Unread", isRead: false },
  { value: "READ", label: "Read", isRead: true },
];

export function NotificationsList() {
  const [tab, setTab] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const active = TABS.find((t) => t.value === tab);
  const { data, isLoading, isError, refetch } = useNotifications(
    active?.isRead,
    page
  );
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  async function handleMarkRead(id: string) {
    try {
      await markRead.mutateAsync(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as read");
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead.mutateAsync();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark all read");
    }
  }

  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="In-app notifications and alerts"
        actions={
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          setPage(1);
        }}
      >
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isError ? (
        <ErrorState
          title="Failed to load notifications"
          description="Could not fetch notifications."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : items.length === 0 ? (
        <div className="rounded-md border p-12 text-center text-muted-foreground text-sm">
          No notifications.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
              className={`flex w-full flex-col gap-1 rounded-md border p-4 text-left transition-colors hover:bg-muted/50 ${
                n.isRead ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{n.title}</span>
                <div className="flex shrink-0 items-center gap-2">
                  {!n.isRead && <Badge variant="outline">Unread</Badge>}
                  <span className="text-muted-foreground text-xs">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{n.message}</p>
            </button>
          ))}
          {data?.meta.hasNextPage && (
            <div className="pt-2 text-center">
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
