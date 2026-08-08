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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cj/ui";
import type { NegotiationStatus, OrderStatus } from "@cj/types";
import {
  NegotiationStatus as NegotiationStatusEnum,
  OrderStatus as OrderStatusEnum,
} from "@cj/types";
import { formatDateTime, formatINR } from "@cj/utils";

import { usePermission } from "@/lib/permissions";

import {
  useAssignVendor,
  useOrder,
  useOrderNegotiations,
  useRespondNegotiation,
  useSubmitCreativeArtwork,
  useUpdateOrderStatus,
  useVendorsForOrders,
} from "./queries";

const STATUS_OPTIONS = Object.values(OrderStatusEnum);

function AssignVendorDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
}: {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const assignVendor = useAssignVendor();
  const { data: vendors } = useVendorsForOrders();
  const [vendorId, setVendorId] = React.useState("");

  async function handleAssign() {
    if (!vendorId) return;
    try {
      await assignVendor.mutateAsync({ orderId, vendorId });
      toast.success("Vendor assigned");
      setVendorId("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign vendor");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Vendor</DialogTitle>
          <DialogDescription>
            Assign a vendor to order {orderNumber}.
          </DialogDescription>
        </DialogHeader>
        <Select value={vendorId || undefined} onValueChange={setVendorId}>
          <SelectTrigger>
            <SelectValue placeholder="Select vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors?.data?.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.vendorName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handleAssign} disabled={!vendorId || assignVendor.isPending}>
            {assignVendor.isPending ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ArtworkUploadDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const submitArtwork = useSubmitCreativeArtwork();
  const [fileUrl, setFileUrl] = React.useState("");
  const [fileName, setFileName] = React.useState("");

  async function handleSubmit() {
    if (!fileUrl || !fileName) return;
    try {
      await submitArtwork.mutateAsync({
        id: orderId,
        data: { fileUrl, fileName },
      });
      toast.success("Creative artwork uploaded");
      setFileUrl("");
      setFileName("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload artwork");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Creative Artwork</DialogTitle>
          <DialogDescription>
            Provide a URL for the creative artwork file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fileUrl">File URL</Label>
            <Input
              id="fileUrl"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="artwork-v1.pdf"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!fileUrl || !fileName || submitArtwork.isPending}
          >
            {submitArtwork.isPending ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrderDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const canUpdate = usePermission("order", "EDIT");
  const canAssign = usePermission("vendor_assignment", "EDIT");
  const canUploadArtwork = usePermission("creative_artwork", "CREATE");
  const canRespond = usePermission("order", "APPROVE");

  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const { data: negotiations, refetch: refetchNegotiations } = useOrderNegotiations(id);
  const updateStatus = useUpdateOrderStatus();
  const respondNegotiation = useRespondNegotiation();

  const [assignOpen, setAssignOpen] = React.useState(false);
  const [artworkOpen, setArtworkOpen] = React.useState(false);

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
    return (
      <ErrorState
        title="Failed to load order"
        description="Could not fetch order details."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) return <LoadingState rows={4} />;

  if (!order) return null;

  const needsVendor = order.status === "PENDING_VENDOR_ASSIGNMENT" && !order.vendorId;

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.orderNumber}
        description={`Brand: ${order.brand?.brandName ?? "—"} · Vendor: ${order.vendor?.vendorName ?? "Not assigned"}`}
        actions={
          <div className="flex items-center gap-2">
            {canAssign && needsVendor && (
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                Assign Vendor
              </Button>
            )}
            {canUploadArtwork && (
              <Button variant="outline" onClick={() => setArtworkOpen(true)}>
                Upload Artwork
              </Button>
            )}
            {canUpdate && (
              <Select
                value={order.status}
                onValueChange={(v) => handleStatus(v as OrderStatus)}
              >
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
            )}
            <Badge variant={order.status === "CANCELLED" ? "destructive" : "outline"}>
              {order.status}
            </Badge>
          </div>
        }
      />

      {assignOpen && (
        <AssignVendorDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          open={assignOpen}
          onOpenChange={setAssignOpen}
        />
      )}
      {artworkOpen && (
        <ArtworkUploadDialog
          orderId={order.id}
          open={artworkOpen}
          onOpenChange={setArtworkOpen}
        />
      )}

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
          <CardTitle>Artwork</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(order.artworks ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {a.fileName}
                    </a>
                  </TableCell>
                  <TableCell>v{a.version}</TableCell>
                  <TableCell>{formatDateTime(a.uploadedAt)}</TableCell>
                </TableRow>
              ))}
              {!order.artworks?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    No artwork uploaded
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                    {n.status === "PENDING" && canRespond && (
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
