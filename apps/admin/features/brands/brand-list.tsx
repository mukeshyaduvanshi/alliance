"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  Textarea,
} from "@cj/ui";
import type { BrandDto } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { InitialsAvatar } from "@/components/initials-avatar";

import { useApproveBrand, useBrands, useRejectBrand } from "./queries";

export function ApprovalDialog({
  brand,
  decision,
  open,
  onOpenChange,
}: {
  brand: BrandDto;
  decision: "APPROVE" | "REJECT";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [remarks, setRemarks] = React.useState("");
  const approve = useApproveBrand();
  const reject = useRejectBrand();
  const isApprove = decision === "APPROVE";

  async function handleSubmit() {
    try {
      if (isApprove) {
        await approve.mutateAsync({ id: brand.id, remarks: remarks || undefined });
        toast.success("Brand approved");
      } else {
        await reject.mutateAsync({ id: brand.id, remarks: remarks || undefined });
        toast.success("Brand rejected");
      }
      onOpenChange(false);
      setRemarks("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApprove ? "Approve" : "Reject"} {brand.brandName}
          </DialogTitle>
          <DialogDescription>
            {brand.contactPersonName} · {brand.email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Remarks (optional)
            <Textarea
              className="mt-1.5"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={isApprove ? "Approval remarks..." : "Reason for rejection..."}
              rows={3}
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? "default" : "destructive"}
            onClick={handleSubmit}
            disabled={approve.isPending || reject.isPending}
          >
            {isApprove ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApprovalActions({ brand }: { brand: BrandDto }) {
  const [decision, setDecision] = React.useState<"APPROVE" | "REJECT" | null>(null);
  if (brand.approvalStatus !== "PENDING") {
    return (
      <Badge variant={brand.approvalStatus === "APPROVED" ? "success" : "destructive"}>
        {brand.approvalStatus}
      </Badge>
    );
  }
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon-sm" onClick={() => setDecision("APPROVE")}>
        <Check className="size-4 text-emerald-500" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => setDecision("REJECT")}>
        <X className="size-4 text-red-500" />
      </Button>
      {decision && (
        <ApprovalDialog
          brand={brand}
          decision={decision}
          open={true}
          onOpenChange={(open) => !open && setDecision(null)}
        />
      )}
    </div>
  );
}

export const brandColumns: ColumnDef<BrandDto>[] = [
  {
    accessorKey: "brandName",
    header: "Brand",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <InitialsAvatar name={row.original.brandName} tone={1} />
        <div>
          <p className="font-medium">{row.original.brandName}</p>
          <p className="text-muted-foreground text-xs">{row.original.email}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "contactPersonName",
    header: "Contact",
    cell: ({ row }) => (
      <div>
        <p>{row.original.contactPersonName}</p>
        <p className="text-muted-foreground text-xs">{row.original.phone}</p>
      </div>
    ),
  },
  {
    accessorKey: "businessProfile.city",
    header: "Location",
    cell: ({ row }) =>
      row.original.businessProfile
        ? `${row.original.businessProfile.city}, ${row.original.businessProfile.state}`
        : "—",
  },
  {
    accessorKey: "approvalStatus",
    header: "Approval",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.approvalStatus === "APPROVED"
            ? "success"
            : row.original.approvalStatus === "PENDING"
              ? "warning"
              : "destructive"
        }
      >
        {row.original.approvalStatus}
      </Badge>
    ),
  },
  {
    accessorKey: "assignedKam",
    header: "KAM",
    cell: ({ row }) => row.original.assignedKam?.fullName ?? "—",
  },
  {
    accessorKey: "createdAt",
    header: "Registered",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    id: "actions",
    cell: ({ row }) => <ApprovalActions brand={row.original} />,
  },
];

export function BrandList({ status }: { status?: string }) {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useBrands(status, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title={status === "PENDING" ? "Brand Approvals" : "All Brands"}
        description={
          status === "PENDING"
            ? "Review and approve pending brand registrations"
            : "Manage brands on the platform"
        }
      />
      {isError ? (
        <ErrorState
          title="Failed to load brands"
          description="Could not fetch brands from the server."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <DataTable
          columns={brandColumns}
          data={data?.data ?? []}
          totalRows={data?.meta.total ?? 0}
          pageIndex={page}
          pageSize={20}
          onPageChange={setPage}
          emptyTitle={status === "PENDING" ? "No pending approvals" : "No brands found"}
          emptyDescription={
            status === "PENDING"
              ? "All brand registrations have been processed."
              : "Brands will appear here after registration."
          }
        />
      )}
    </div>
  );
}
