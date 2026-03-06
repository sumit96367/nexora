"use client";

import { useTransition } from "react";
import { respondToMentorSession } from "@/actions/mentor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MentorSessionActions({ session }) {
  const [isPending, startTransition] = useTransition();

  if (!session) {
    return null;
  }

  const actionLabel = {
    confirm: "confirmed",
    cancel: "cancelled",
    complete: "marked as completed",
  };

  const handleAction = (action) => {
    startTransition(async () => {
      try {
        await respondToMentorSession(session.id, action);
        toast.success(`Session ${actionLabel[action] ?? action}.`);
      } catch (error) {
        toast.error(error.message || "Failed to update session.");
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {session.status === "PENDING" ? (
        <>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => handleAction("confirm")}
          >
            Confirm
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => handleAction("cancel")}
          >
            Decline
          </Button>
        </>
      ) : null}
      {session.status === "CONFIRMED" ? (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => handleAction("complete")}
          >
            Mark completed
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => handleAction("cancel")}
          >
            Cancel
          </Button>
        </>
      ) : null}
    </div>
  );
}

