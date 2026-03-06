"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MentorConversationList({
  conversations,
  activeConversationId,
}) {
  if (!conversations?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        When mentees reach out, the conversation list will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const isActive = conversation.id === activeConversationId;
        const lastMessage = conversation.messages?.[0];

        return (
          <Link
            key={conversation.id}
            href={`/mentors/messages/${conversation.id}`}
            className={cn(
              "block rounded-lg border border-transparent p-3 transition hover:border-border/60 hover:bg-muted/40",
              isActive && "border-primary/50 bg-primary/5",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {conversation.mentee?.name ?? "Mentee"}
                </p>
                {lastMessage ? (
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {lastMessage.body}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Conversation started
                  </p>
                )}
              </div>
              {conversation.unreadCount ? (
                <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {conversation.unreadCount}
                </span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

