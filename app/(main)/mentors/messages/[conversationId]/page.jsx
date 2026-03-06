import { notFound, redirect } from "next/navigation";
import { getMentorInbox, getMentorConversation, markMentorConversationRead } from "@/actions/mentor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MentorConversationList from "../../_components/mentor-conversation-list";
import MentorMessageThread from "../../_components/mentor-message-thread";
import MentorMessageComposer from "../../_components/mentor-message-composer";

export default async function MentorConversationPage({ params }) {
  const conversationId = params?.conversationId;

  if (!conversationId) {
    notFound();
  }

  let inbox;

  try {
    inbox = await getMentorInbox();
  } catch (error) {
    console.error("Mentor messaging access denied:", error);
    redirect("/mentors/apply");
  }

  let conversation;

  try {
    conversation = await getMentorConversation(conversationId);
  } catch (error) {
    console.error("Failed to load conversation:", error);
    notFound();
  }

  const viewerId = conversation.mentor?.user?.id ?? conversation.menteeId;

  await markMentorConversationRead(conversationId);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Mentor messages</h1>
        <p className="text-muted-foreground">
          Respond quickly and keep mentees engaged with thoughtful, timely
          replies.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <MentorConversationList
              conversations={inbox.conversations}
              activeConversationId={conversationId}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Chat with {conversation.mentee?.name ?? "your mentee"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MentorMessageThread
                conversation={conversation}
                viewerId={viewerId}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <MentorMessageComposer
                conversationId={conversation.id}
                mentorId={conversation.mentorId}
                menteeId={conversation.menteeId}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

