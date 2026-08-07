"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@cj/ui";
import { Button } from "@cj/ui";
import { Card, CardContent } from "@cj/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { Textarea } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";
import { toast } from "sonner";

import { useApproveArtwork, useBrandOrders, useRejectArtwork } from "@/features/queries";

export default function BrandArtworkApprovalPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useBrandOrders(
    "PENDING_BRAND_APPROVAL",
    page
  );
  const approve = useApproveArtwork();
  const reject = useRejectArtwork();
  const [rejectFor, setRejectFor] = React.useState<string | null>(null);
  const [remarks, setRemarks] = React.useState("");

  const pending = data?.data ?? [];

  const onApprove = (id: string) =>
    approve.mutate(id, {
      onSuccess: () => toast.success("Artwork approved"),
      onError: (e) => toast.error(e.message ?? "Failed to approve"),
    });

  const onReject = () => {
    if (!rejectFor) return;
    reject.mutate(rejectFor, {
      onSuccess: () => {
        toast.success("Artwork rejected for revision");
        setRejectFor(null);
        setRemarks("");
      },
      onError: (e) => toast.error(e.message ?? "Failed to reject"),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Artwork Approval"
        description="Approve or reject artwork submitted for your orders"
      />
      {isError ? (
        <ErrorState
          title="Failed to load artwork"
          description="Could not fetch orders pending your approval."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={3} />
      ) : pending.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No artwork pending your approval.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((order) => (
            <Card key={order.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(order.createdAt)} ·{" "}
                      {formatINR(Number(order.totalAmount))}
                    </p>
                  </div>
                  <Badge variant="secondary">{order.status}</Badge>
                </div>

                <div className="space-y-1">
                  {order.artworks && order.artworks.length > 0 ? (
                    order.artworks.map((art) => (
                      <a
                        key={art.id}
                        href={art.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {art.fileName}
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No artwork file attached.
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={approve.isPending}
                    onClick={() => onApprove(order.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={reject.isPending}
                    onClick={() => setRejectFor(order.id)}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectFor !== null} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Artwork</DialogTitle>
            <DialogDescription>
              Provide remarks for the creative team.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Remarks…"
          />
          <DialogFooter>
            <Button variant="destructive" onClick={onReject} disabled={reject.isPending}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
