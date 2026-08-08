"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
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
import type { VendorDto } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { InitialsAvatar } from "@/components/initials-avatar";

import { useApproveVendor, useRejectVendor, useVendors } from "./queries";

function VendorApprovalDialog({
  vendor,
  decision,
  open,
  onOpenChange,
}: {
  vendor: VendorDto;
  decision: "APPROVE" | "REJECT";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [remarks, setRemarks] = React.useState("");
  const approve = useApproveVendor();
  const reject = useRejectVendor();
  const isApprove = decision === "APPROVE";

  async function handleSubmit() {
    try {
      if (isApprove) {
        await approve.mutateAsync({ id: vendor.id, remarks: remarks || undefined });
        toast.success("Vendor approved");
      } else {
        await reject.mutateAsync({ id: vendor.id, remarks: remarks || undefined });
        toast.success("Vendor rejected");
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
            {isApprove ? "Approve" : "Reject"} {vendor.vendorName}
          </DialogTitle>
          <DialogDescription>
            {vendor.contactPersonName} · {vendor.email}
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

function ApprovalActions({ vendor }: { vendor: VendorDto }) {
  const [decision, setDecision] = React.useState<"APPROVE" | "REJECT" | null>(null);
  if (vendor.approvalStatus !== "PENDING") {
    return (
      <Badge variant={vendor.approvalStatus === "APPROVED" ? "success" : "destructive"}>
        {vendor.approvalStatus}
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
        <VendorApprovalDialog
          vendor={vendor}
          decision={decision}
          open={true}
          onOpenChange={(open) => !open && setDecision(null)}
        />
      )}
    </div>
  );
}

const columns: ColumnDef<VendorDto>[] = [
  {
    accessorKey: "vendorName",
    header: "Vendor",
    cell: ({ row }) => (
      <Link href={`/vendors/${row.original.id}`} className="flex items-center gap-3">
        <InitialsAvatar name={row.original.vendorName} tone={2} />
        <span>
          <span className="font-medium hover:underline">{row.original.vendorName}</span>
          {row.original.email && (
            <span className="text-muted-foreground block text-xs">{row.original.email}</span>
          )}
        </span>
      </Link>
    ),
  },
  {
    accessorKey: "contactPersonName",
    header: "Contact",
    cell: ({ row }) => row.original.contactPersonName ?? "—",
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
    accessorKey: "createdAt",
    header: "Registered",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    id: "actions",
    cell: ({ row }) => <ApprovalActions vendor={row.original} />,
  },
];

export function VendorList({ status }: { status?: string }) {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useVendors(status, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title={status === "PENDING" ? "Vendor Approvals" : "All Vendors"}
        description={
          status === "PENDING"
            ? "Review and approve pending vendor registrations"
            : "Manage vendors on the platform"
        }
      />
      {isError ? (
        <ErrorState
          title="Failed to load vendors"
          description="Could not fetch vendors from the server."
          onRetry={() => refetch()}
        />
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
          emptyTitle={status === "PENDING" ? "No pending approvals" : "No vendors found"}
          emptyDescription={
            status === "PENDING"
              ? "All vendor registrations have been processed."
              : "Vendors will appear here after registration."
          }
        />
      )}
    </div>
  );
}
