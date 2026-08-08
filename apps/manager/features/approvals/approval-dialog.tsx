"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "@cj/ui";
import type { WorkflowInstanceDto } from "@cj/types";

import {
  useApproveInstance,
  useEscalateInstance,
  useRejectInstance,
} from "./queries";

export type Decision = "APPROVE" | "REJECT" | "ESCALATE";

const DECISION_META: Record<Decision, { title: string; description: string }> = {
  APPROVE: { title: "Approve", description: "Approve this workflow instance." },
  REJECT: { title: "Reject", description: "Reject this workflow instance." },
  ESCALATE: {
    title: "Escalate",
    description: "Escalate this workflow to a higher authority.",
  },
};

export function DecisionDialog({
  instance,
  decision,
  open,
  onOpenChange,
}: {
  instance: WorkflowInstanceDto;
  decision: Decision;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [remarks, setRemarks] = React.useState("");
  const approve = useApproveInstance();
  const reject = useRejectInstance();
  const escalate = useEscalateInstance();

  async function handleSubmit() {
    const payload = { id: instance.id, remarks: remarks || undefined };
    try {
      if (decision === "APPROVE") {
        await approve.mutateAsync(payload);
        toast.success("Approved");
      } else if (decision === "REJECT") {
        await reject.mutateAsync(payload);
        toast.success("Rejected");
      } else {
        await escalate.mutateAsync(payload);
        toast.success("Escalated");
      }
      onOpenChange(false);
      setRemarks("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  const meta = DECISION_META[decision];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meta.title} workflow instance</DialogTitle>
          <DialogDescription>
            {instance.workflowRule?.name ?? instance.entityType} —{" "}
            {instance.entityId}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Remarks (optional)
            </label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={decision === "REJECT" ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={approve.isPending || reject.isPending || escalate.isPending}
          >
            {meta.title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
