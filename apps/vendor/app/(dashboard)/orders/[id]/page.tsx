"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@cj/ui";
import { Button } from "@cj/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@cj/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@cj/ui";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@cj/ui";
import { Input } from "@cj/ui";
import { Textarea } from "@cj/ui";
import { ErrorState } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { formatDateTime, formatINR } from "@cj/utils";
import { NegotiationStatus } from "@cj/types";
import { toast } from "sonner";

import { useProposeNegotiation, useVendorOrder } from "@/features/queries";

const negotiateSchema = z.object({
  proposedAmount: z.coerce.number().min(1, "Amount must be positive"),
  remarks: z.string().optional(),
});

type NegotiateValues = z.infer<typeof negotiateSchema>;

export default function VendorOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: order, isLoading, isError, refetch } = useVendorOrder(id);
  const negotiate = useProposeNegotiation();
  const [open, setOpen] = React.useState(false);

  const form = useForm<NegotiateValues>({
    resolver: zodResolver(negotiateSchema),
    defaultValues: { proposedAmount: 0 },
  });

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

  const canNegotiate = ["VENDOR_ASSIGNED", "IN_PRODUCTION"].includes(order.status);
  const lastNegotiation = (order.negotiations ?? [])[0];

  const onSubmit = (values: NegotiateValues) => {
    negotiate.mutate(
      { orderId: order.id, data: { proposedAmount: values.proposedAmount, remarks: values.remarks } },
      {
        onSuccess: () => {
          toast.success("Negotiation proposed");
          setOpen(false);
          form.reset({ proposedAmount: 0 });
        },
        onError: (e) => toast.error(e.message ?? "Failed to propose negotiation"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/orders" className="text-sm text-muted-foreground hover:underline">
            ← Back to orders
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
          <p className="text-muted-foreground text-sm">
            Assigned {formatDateTime(order.createdAt)} · {order.siteLocation}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{order.status}</Badge>
          {canNegotiate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Negotiate Amount</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Negotiate Order Amount</DialogTitle>
                  <DialogDescription>
                    Propose a revised amount for order {order.orderNumber}.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="proposedAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proposed Amount (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Reason for amount revision…" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={negotiate.isPending}>
                        {negotiate.isPending ? "Submitting…" : "Submit Proposal"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
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
                    <p className="text-sm font-medium">{item.product?.name ?? "Product"}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.region} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {item.vendorAmount ? formatINR(Number(item.vendorAmount)) : formatINR(Number(item.amount))}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {item.vendorRateSnapshot
                        ? `₹${Number(item.vendorRateSnapshot)} / unit`
                        : `₹${Number(item.rateSnapshot)} / unit`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="font-medium">Order Total</span>
              <span className="text-sm">{formatINR(Number(order.totalAmount))}</span>
            </div>
            {order.vendorTotalAmount != null && (
              <div className="mt-1 flex items-center justify-between">
                <span className="font-medium text-muted-foreground">Your Amount</span>
                <span className="font-semibold">{formatINR(Number(order.vendorTotalAmount))}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Artwork</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
              <p className="text-muted-foreground text-sm">No artwork uploaded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Negotiation History</CardTitle>
        </CardHeader>
        <CardContent>
          {order.negotiations && order.negotiations.length > 0 ? (
            <div className="divide-y">
              {order.negotiations.map((n) => (
                <div key={n.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{formatINR(Number(n.proposedAmount))}</p>
                    {n.remarks && (
                      <p className="text-muted-foreground text-xs">{n.remarks}</p>
                    )}
                    <p className="text-muted-foreground text-xs">{formatDateTime(n.createdAt)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge
                      variant={
                        n.status === NegotiationStatus.ACCEPTED
                          ? "secondary"
                          : n.status === NegotiationStatus.REJECTED
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {n.status}
                    </Badge>
                    {n.responseRemarks && (
                      <p className="text-muted-foreground text-xs">{n.responseRemarks}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No negotiations yet.</p>
          )}
          {lastNegotiation?.status === "PENDING" && (
            <p className="mt-3 text-sm text-muted-foreground">
              Your latest proposal is pending review.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
