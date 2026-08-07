"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@cj/ui";
import { Button } from "@cj/ui";
import { Card, CardContent } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { formatDateTime } from "@cj/utils";
import type { NotificationDto } from "@cj/types";

import {
  useBrandNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/features/queries";

export default function BrandNotificationsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useBrandNotifications(undefined, page);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.data ?? [];
  const unread = notifications.filter((n) => !n.isRead).length;

  const onOpen = (n: NotificationDto) => {
    if (!n.isRead) markRead.mutate(n.id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unread} unread`}
        actions={
          notifications.some((n) => !n.isRead) ? (
            <Button
              variant="outline"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {isError ? (
        <ErrorState
          title="Failed to load notifications"
          description="Could not fetch your notifications."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No notifications.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const body = (
              <Card
                key={n.id}
                className={n.isRead ? "" : "border-primary/40 bg-primary/5"}
                onClick={() => onOpen(n)}
              >
                <CardContent className="flex items-start justify-between gap-4 pt-6">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-muted-foreground text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <Badge variant="secondary">New</Badge>
                  )}
                </CardContent>
              </Card>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} onClick={() => onOpen(n)}>
                {body}
              </Link>
            ) : (
              body
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {data?.meta.page} of{" "}
              {Math.max(1, Math.ceil((data?.meta.total ?? 0) / 20))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
