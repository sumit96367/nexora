"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/components/ui/cn";

export default function MentorMessageThread({ conversation, viewerId }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 p-10 text-sm text-muted-foreground">
        Select a conversation to view messages.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-[520px] flex-col gap-4 overflow-y-auto rounded-lg border border-border/60 bg-background/60 p-4"
    >
      {conversation.messages?.length ? (
        conversation.messages.map((message) => {
          const isViewer = message.senderId === viewerId;

          return (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1",
                isViewer ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm",
                  isViewer
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {message.body}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(message.createdAt).toLocaleString()}
              </span>
            </div>
          );
        })
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          No messages yet. Start the conversation below.
        </p>
      )}
    </div>
  );
}

