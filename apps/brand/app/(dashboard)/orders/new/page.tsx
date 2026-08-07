"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@cj/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@cj/ui";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@cj/ui";
import { Input } from "@cj/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@cj/ui";
import { Textarea } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { ArtworkSubmissionType } from "@cj/types";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import {
  useBrandProducts,
  useBrandPurchaseOrders,
  usePlaceOrder,
} from "@/features/queries";

const itemSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

const orderSchema = z.object({
  poId: z.string().optional(),
  siteLocation: z.string().min(3, "Site location is required"),
  artworkSubmissionType: z.nativeEnum(ArtworkSubmissionType),
  artworkFileName: z.string().min(1, "Artwork file is required"),
  artworkFileUrl: z.string().url("Enter a valid file URL"),
  items: z.array(itemSchema).min(1, "Add at least one item"),
});

type OrderValues = z.infer<typeof orderSchema>;

export default function PlaceOrderPage() {
  const router = useRouter();
  const placeOrder = usePlaceOrder();
  const products = useBrandProducts(1);
  const pos = useBrandPurchaseOrders(1);

  const form = useForm<OrderValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      artworkSubmissionType: ArtworkSubmissionType.READY_ARTWORK,
      items: [{ productId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = (values: OrderValues) => {
    placeOrder.mutate(
      {
        poId: values.poId || undefined,
        siteLocation: values.siteLocation,
        artworkSubmissionType: values.artworkSubmissionType,
        artworkFileUrl: values.artworkFileUrl,
        artworkFileName: values.artworkFileName,
        items: values.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Order placed successfully");
          router.push("/orders");
        },
        onError: (e) => toast.error(e.message ?? "Failed to place order"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Place Order"
        description="Create a new order against your purchase order"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="poId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Order</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select PO (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {pos.data?.data.map((po) => (
                            <SelectItem key={po.id} value={po.id}>
                              {po.poNumber} (₹{Number(po.totalBudget).toLocaleString("en-IN")})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="siteLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Delivery site / address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="artworkSubmissionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artwork Submission Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ArtworkSubmissionType.READY_ARTWORK}>
                            Ready Artwork
                          </SelectItem>
                          <SelectItem value={ArtworkSubmissionType.REFERENCE}>
                            Reference Artwork (creative in progress)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="artworkFileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artwork File Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. banner-v1.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="artworkFileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artwork File URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Items</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ productId: "", quantity: 1 })}
              >
                <Plus className="size-4" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.isLoading ? (
                <p className="text-muted-foreground text-sm">Loading products…</p>
              ) : products.data?.data.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No products available in your rate card.
                </p>
              ) : (
                fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-3">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Product</FormLabel>
                            <FormControl>
                              <Select value={f.value || undefined} onValueChange={f.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(products.data?.data ?? []).map((p) => (
                                    <SelectItem key={p.id as string} value={p.id as string}>
                                      {p.name as string} — ₹{Number((p.rate as string) ?? 0).toLocaleString("en-IN")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-32">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Qty</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Button type="submit" disabled={placeOrder.isPending} className="w-full">
            {placeOrder.isPending ? "Placing order…" : "Place Order"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
