"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ErrorState,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import type { CreateProductDto, ProductCategoryDto, ProductDto, Region, RegionRateInput } from "@cj/types";
import { Region as RegionEnum } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { useCategories, useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from "./queries";

const REGIONS = Object.values(RegionEnum);
const regionLabel = (r: Region) => r.replace(/_/g, " ");

const productSchema = z.object({
  name: z.string().min(2, "Name required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  categoryId: z.string().optional(),
});

type ProductValues = z.infer<typeof productSchema>;

function RateEditor({
  rates,
  onRates,
  label,
}: {
  rates: { region: Region; rate: string }[];
  onRates: (rates: { region: Region; rate: string }[]) => void;
  label: string;
}) {
  function updateRate(region: Region, rate: string) {
    const updated = rates.some((r) => r.region === region)
      ? rates.map((r) => (r.region === region ? { ...r, rate } : r))
      : [...rates, { region, rate }];
    onRates(updated);
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="rounded-md border">
        {REGIONS.map((r) => {
          const row = rates.find((x) => x.region === r);
          return (
            <div key={r} className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0">
              <Label className="text-xs font-medium capitalize">{regionLabel(r)}</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="w-32"
                placeholder="Rate (₹)"
                value={row?.rate ?? ""}
                onChange={(e) => updateRate(r, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductFormDialog({
  product,
  categories,
  open,
  onOpenChange,
}: {
  product?: ProductDto;
  categories?: ProductCategoryDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [brandRates, setBrandRates] = React.useState<{ region: Region; rate: string }[]>([]);
  const [vendorRates, setVendorRates] = React.useState<{ region: Region; rate: string }[]>([]);
  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      description: product?.description ?? "",
      unit: product?.unit ?? "",
      categoryId: product?.categoryId ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: product?.name ?? "",
        sku: product?.sku ?? "",
        description: product?.description ?? "",
        unit: product?.unit ?? "",
        categoryId: product?.categoryId ?? "",
      });
      setBrandRates(
        (product?.brandRegionRates ?? []).map((r) => ({
          region: r.region,
          rate: String(r.rate),
        }))
      );
      setVendorRates(
        (product?.vendorRegionRates ?? []).map((r) => ({
          region: r.region,
          rate: String(r.rate),
        }))
      );
    }
  }, [open, product, form]);

  function ratesPayload(rates: { region: Region; rate: string }[]): RegionRateInput[] {
    return rates
      .filter((r) => r.rate !== "")
      .map((r) => ({ region: r.region, rate: Number(r.rate) }));
  }

  async function onSubmit(values: ProductValues) {
    try {
      const payload = {
        name: values.name,
        sku: values.sku || undefined,
        description: values.description || undefined,
        unit: values.unit || undefined,
        categoryId: values.categoryId || undefined,
        brandRegionRates: ratesPayload(brandRates),
        vendorRegionRates: ratesPayload(vendorRates),
      };
      if (product) {
        await updateProduct.mutateAsync({ id: product.id, data: payload });
        toast.success("Product updated");
      } else {
        await createProduct.mutateAsync(payload as CreateProductDto);
        toast.success("Product created");
      }
      onOpenChange(false);
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Create Product"}</DialogTitle>
          <DialogDescription>
            Add or update a product in the master catalog.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Vinyl Flex 12ft" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="VF-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="sq.ft" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Short description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <RateEditor
              rates={brandRates}
              onRates={setBrandRates}
              label="Brand rates (selling price per region)" />
            <RateEditor
              rates={vendorRates}
              onRates={setVendorRates}
              label="Vendor rates (payout per region)" />
            <DialogFooter>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {product ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProductDialog({ product }: { product: ProductDto }) {
  const deleteProduct = useDeleteProduct();
  async function handleDelete() {
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product");
    }
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete "{product.name}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={deleteProduct.isPending}>
            {deleteProduct.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ProductActions({ product, categories }: { product: ProductDto; categories?: ProductCategoryDto[] }) {
  const [editOpen, setEditOpen] = React.useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DeleteProductDialog product={product} />
        </DropdownMenuContent>
      </DropdownMenu>
      <ProductFormDialog product={product} categories={categories} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

export function ProductsOverview() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useProducts(page);
  const { data: categories } = useCategories();

  const columns: ColumnDef<ProductDto>[] = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          {row.original.sku && (
            <p className="text-muted-foreground text-xs">SKU: {row.original.sku}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "category.name",
      header: "Category",
      cell: ({ row }) => row.original.category?.name ?? "—",
    },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => row.original.unit ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "ACTIVE" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      id: "actions",
      cell: ({ row }) => <ProductActions product={row.original} categories={categories?.data} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage the product master catalog"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCreateOpen(true)}>
                <PackagePlus className="size-4" />
                Create Product
              </Button>
            </DialogTrigger>
            <ProductFormDialog categories={categories?.data} open={createOpen} onOpenChange={setCreateOpen} />
          </Dialog>
        }
      />
      {isError ? (
        <ErrorState title="Failed to load products" description="Could not fetch products from the server." onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          totalRows={data?.meta.total ?? 0}
          pageIndex={page}
          pageSize={20}
          onPageChange={setPage}
          emptyTitle="No products found"
          emptyDescription="Create your first product to get started."
        />
      )}
    </div>
  );
}
