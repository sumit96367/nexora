"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { respondToMentorSession } from "@/actions/mentor";
import { toast } from "sonner";

export default function MenteeSessionActions({ session }) {
  const [isPending, startTransition] = useTransition();

  if (!session) return null;

  const handleCancel = () => {
    startTransition(async () => {
      try {
        await respondToMentorSession(session.id, "cancel", {
          reason: "Cancelled by mentee",
        });
        toast.success("Session cancelled");
      } catch (error) {
        toast.error(error.message || "Unable to cancel session");
      }
    });
  };

  const showJoin =
    session.status === "CONFIRMED" &&
    typeof session.meetingUrl === "string" &&
    session.meetingUrl.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showJoin ? (
        <Button asChild size="sm" variant="secondary">
          <a
            href={session.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join session
          </a>
        </Button>
      ) : null}
      {session.status === "PENDING" || session.status === "CONFIRMED" ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={handleCancel}
        >
          {isPending ? "Cancelling..." : "Cancel"}
        </Button>
      ) : null}
    </div>
  );
}
