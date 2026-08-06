"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cj/ui";
import type { NegotiationStatus } from "@cj/types";
import { NegotiationStatus as NegotiationStatusEnum, OrderStatus } from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import {
  useOrder,
  useOrderNegotiations,
  useRespondNegotiation,
  useUpdateOrderStatus,
} from "./queries";

const STATUS_OPTIONS = Object.values(OrderStatus);

export function OrderDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const { data: negotiations, refetch: refetchNegotiations } = useOrderNegotiations(id);
  const updateStatus = useUpdateOrderStatus();
  const respondNegotiation = useRespondNegotiation();

  async function handleStatus(status: OrderStatus) {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status → ${status}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleRespond(negotiationId: string, status: NegotiationStatus) {
    try {
      await respondNegotiation.mutateAsync({
        negotiationId,
        data: { status },
      });
      toast.success("Negotiation updated");
      refetchNegotiations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to respond");
    }
  }

  if (isError) {
    return <ErrorState title="Failed to load order" description="Could not fetch order details." onRetry={() => refetch()} />;
  }

  if (isLoading) return <LoadingState rows={4} />;

  if (!order) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.orderNumber}
        description={`Brand: ${order.brand?.brandName ?? "—"} · Vendor: ${order.vendor?.vendorName ?? "Not assigned"}`}
        actions={
          <div className="flex items-center gap-2">
            <Select value={order.status} onValueChange={(v) => handleStatus(v as OrderStatus)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant={order.status === "CANCELLED" ? "destructive" : "outline"}>
              {order.status}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(order.items ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product?.name ?? item.productId.slice(0, 8)}</TableCell>
                    <TableCell>{item.region}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatINR(item.rateSnapshot)}</TableCell>
                    <TableCell className="text-right">{formatINR(item.amount)}</TableCell>
                  </TableRow>
                ))}
                {!order.items?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      No items
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Site</span>
              <span>{order.siteLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Artwork Type</span>
              <span>{order.artworkSubmissionType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-semibold">{formatINR(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{formatDateTime(order.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Negotiations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Proposed Amount</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(negotiations ?? []).map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{n.vendor?.vendorName ?? "—"}</TableCell>
                  <TableCell>{formatINR(n.proposedAmount)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{n.remarks ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={n.status === "PENDING" ? "outline" : n.status === "ACCEPTED" ? "default" : "destructive"}>
                      {n.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {n.status === "PENDING" && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => handleRespond(n.id, NegotiationStatusEnum.ACCEPTED)}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRespond(n.id, NegotiationStatusEnum.REJECTED)}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!negotiations?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    No negotiations
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
