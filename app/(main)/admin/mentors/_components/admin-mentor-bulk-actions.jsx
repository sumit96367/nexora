"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkReviewMentorApplications } from "@/components/ui/bulkreviewmentorapplications";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export default function AdminMentorBulkActions({ selectedIds, onClear }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!selectedIds?.length) {
    return null;
  }

  const handleAction = (decision) => {
    let reason;
    if (decision === "reject") {
      reason = window.prompt("Provide a rejection reason for these mentors:");
      if (!reason || !reason.trim()) {
        toast.error("Rejection reason is required");
        return;
      }
    }

    startTransition(async () => {
      try {
        const result = await bulkReviewMentorApplications({
          mentorIds: selectedIds,
          decision,
          reason,
        });

        const actionVerb = decision === "approve" ? "Approved" : "Rejected";
        toast.success(`${actionVerb} ${result.updated} application(s)`);
        onClear?.();
        router.refresh();
      } catch (error) {
        toast.error(error.message || "Bulk action failed");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      <span>{selectedIds.length} selected</span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => handleAction("approve")}
        >
          <Check className="mr-1 h-4 w-4" />
          Approve selected
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() => handleAction("reject")}
        >
          <X className="mr-1 h-4 w-4" />
          Reject selected
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={onClear}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
