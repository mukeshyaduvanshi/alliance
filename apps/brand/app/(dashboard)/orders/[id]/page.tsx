"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@cj/ui";
import { Button } from "@cj/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@cj/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { Textarea } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";
import { toast } from "sonner";

import {
  useApproveArtwork,
  useBrandOrder,
  useCancelOrder,
  useRejectArtwork,
} from "@/features/queries";
import { orderBadge } from "@/lib/status";

function ArtworkApprovalActions({ orderId }: { orderId: string }) {
  const approve = useApproveArtwork();
  const reject = useRejectArtwork();
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [remarks, setRemarks] = React.useState("");

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => approve.mutate(orderId)}
        disabled={approve.isPending}
      >
        Approve Artwork
      </Button>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={reject.isPending}>
            Reject Artwork
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Artwork</DialogTitle>
            <DialogDescription>
              Provide remarks explaining what needs to be changed.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Remarks for revision…"
          />
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={reject.isPending}
              onClick={() => {
                reject.mutate(orderId);
                setRejectOpen(false);
                setRemarks("");
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BrandOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: order, isLoading, isError, refetch } = useBrandOrder(id);
  const cancel = useCancelOrder();

  if (isError) {
    return (
      <ErrorState
        title="Failed to load order"
        description="Could not fetch order details."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading || !order) return <LoadingState rows={4} />;

  const canApprove = order.status === "PENDING_BRAND_APPROVAL";
  const canCancel = ["PLACED", "CREATIVE_IN_PROGRESS"].includes(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/orders" className="text-sm text-muted-foreground hover:underline">
            ← Back to orders
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {order.orderNumber}
          </h1>
          <p className="text-muted-foreground text-sm">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={orderBadge(order.status)}>{order.status}</Badge>
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate(order.id)}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {item.product?.name ?? "Product"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {item.region} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm">{formatINR(Number(item.amount))}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="font-medium">Total</span>
              <span className="text-lg font-semibold">
                {formatINR(Number(order.totalAmount))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Artwork</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.artworks && order.artworks.length > 0 ? (
              order.artworks.map((art) => (
                <div key={art.id} className="space-y-1">
                  <a
                    href={art.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {art.fileName}
                  </a>
                  <p className="text-muted-foreground text-xs">
                    Uploaded {formatDateTime(art.uploadedAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                No artwork uploaded yet.
              </p>
            )}
            {canApprove && (
              <div className="pt-2">
                <ArtworkApprovalActions orderId={order.id} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
