"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMentorMessage } from "@/components/ui/sendmentormessage";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MentorMessageComposer({
  conversationId,
  mentorId,
  menteeId,
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = (event) => {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    startTransition(async () => {
      try {
        await sendMentorMessage({
          conversationId,
          mentorId,
          menteeId,
          body: message.trim(),
        });
        setMessage("");
        router.refresh();
      } catch (error) {
        toast.error(error.message || "Unable to send message");
      }
    });
  };

  return (
    <form onSubmit={handleSend} className="space-y-3">
      <Textarea
        placeholder="Write your reply..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={4}
      />
      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Sending..." : "Send message"}
        </Button>
      </div>
    </form>
  );
}

